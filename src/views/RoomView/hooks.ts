import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/router'

export interface Participant {
  id: string
  nickname: string
  isFacilitator: boolean
  hasVoted: boolean
  vote?: string
}

export interface Task {
  id: string
  text: string
  isRevealed: boolean
  votes: Record<string, string>
  average?: number
  comments: string[]
}

export const POINT_CARDS = ['1', '2', '3', '5', '8', '13', '21', '?', '☕']

export const useRoomView = () => {
  const router = useRouter()
  const { roomId, nickname, isFacilitator } = router.query


  const [localMember, setLocalMember] = useState<any>(null)
  const [dataStream, setDataStream] = useState<any>(null)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [currentTask, setCurrentTask] = useState<Task | null>(null)
  const [selectedCard, setSelectedCard] = useState<string>('')
  const [taskText, setTaskText] = useState('')
  const [comment, setComment] = useState('')
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isClient, setIsClient] = useState(false)

  const isFacilitatorBool = isFacilitator === 'true'

  // クライアントサイドかどうかを確認
  useEffect(() => {
    setIsClient(true)
  }, [])

  // SkyWayルームに接続
  const connectToRoom = useCallback(async () => {
    if (!roomId || !nickname || !isClient) return

    setIsConnecting(true)
    setError(null)

    try {
      console.log('Connecting to SkyWay room:', roomId, 'as', nickname)

      // SkyWay SDKを動的インポート（SSR回避）
      const {
        nowInSec,
        SkyWayAuthToken,
        uuidV4,
        SkyWayRoom,
        SkyWayContext,
        SkyWayStreamFactory
      } = await import('@skyway-sdk/room')

      // SkyWayトークンの確認
      const token = new SkyWayAuthToken({
        jti: uuidV4(),
        iat: nowInSec(),
        exp: nowInSec() + 60 * 60 * 24,
        version: 3,
        scope: {
          appId: process.env.NEXT_PUBLIC_SKYWAY_APP_ID ?? "",
          rooms: [
            {
              name: "*",
              methods: ["create", "close", "updateMetadata"],
              member: {
                name: "*",
                methods: ["publish", "subscribe", "updateMetadata"],
              },
            },
          ],
        },
      }).encode(process.env.NEXT_PUBLIC_SKYWAY_TOKEN ?? "")

      // 開発用モックモード（トークンが設定されていない場合、または無効なトークンの場合）
      if (!token) {
        console.log('SkyWayトークンが設定されていない')

        return
      }

      // SkyWayの初期化
      const context = await SkyWayContext.Create(token)

      // ルームの作成または参加
      const newRoom = await SkyWayRoom.FindOrCreate(context, {
        type: "p2p",
        name: roomId as string,
      })

      // メンバー名を英数字のみに制限（SkyWayの要件）
      const memberName = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      // メタデータを作成
      const memberMetadata = {
        userId: memberName, // ユーザーIDとしてメンバー名を使用
        nickname: nickname,
        isFacilitator: isFacilitatorBool,
      }
      console.log('Joining with metadata:', memberMetadata)

      // ルームメンバーとして参加
      const member = await newRoom.join({
        name: memberName,
        metadata: JSON.stringify(memberMetadata),
      })

      console.log('Joined as member:', member.id, 'with metadata:', member.metadata)

      // データストリームを作成
      const stream = await SkyWayStreamFactory.createDataStream()
      await member.publish(stream)
      setDataStream(stream)

        // データストリームの受信処理を設定（型アサーションで回避）
        ; (stream as any).onData?.add((data: any) => {
          try {
            console.log('Raw data stream data:', data)
            const messageData = data.data || data
            const message = JSON.parse(messageData)
            console.log('Received data stream message:', message)
            handleDataMessage(message)
          } catch (err) {
            console.error('データストリームメッセージの解析エラー:', err, 'Raw data:', data)
          }
        })

      // 既存の参加者を取得
      console.log('Room members:', newRoom.members)
      console.log('Room members length:', newRoom.members.length)

      // メンバー情報の取得方法を試行
      let existingMembers: any[] = []
      if (newRoom.members && newRoom.members.length > 0) {
        existingMembers = newRoom.members.filter((m: any) => m.id !== member.id)
      } else if ((newRoom as any).members) {
        existingMembers = (newRoom as any).members.filter((m: any) => m.id !== member.id)
      }

      console.log('Existing members:', existingMembers.length)
      for (const existingMember of existingMembers) {
        try {
          console.log('Existing member object:', existingMember)
          console.log('Existing member id:', existingMember.id)
          console.log('Existing member metadata:', existingMember.metadata)
          const metadata = JSON.parse(existingMember.metadata || '{}')
          console.log('Parsed existing member metadata:', metadata)
          const existingParticipant: Participant = {
            id: metadata.userId || existingMember.id || `member-${Date.now()}`,
            nickname: metadata.nickname || 'Unknown',
            isFacilitator: metadata.isFacilitator || false,
            hasVoted: false,
          }
          console.log('Created existing participant:', existingParticipant)
          setParticipants(prev => [...prev, existingParticipant])
        } catch (err) {
          console.error('既存参加者情報の解析エラー:', err)
        }
      }

      // 既存のデータストリームを購読
      const existingStreams = newRoom.publications.filter(pub => pub.contentType === 'data')
      console.log('Existing streams:', existingStreams.length)
      for (const publication of existingStreams) {
        if (publication.publisher.id !== member.id) {
          console.log('Subscribing to stream from:', publication.publisher.id)
          const subscription = await member.subscribe(publication)
            ; (subscription.stream as any).onData?.add((data: any) => {
              try {
                console.log('Raw subscription data:', data)
                const messageData = data.data || data
                const message = JSON.parse(messageData)
                console.log('Received subscription message:', message)
                handleDataMessage(message)
              } catch (err) {
                console.error('購読メッセージの解析エラー:', err, 'Raw data:', data)
              }
            })
        }
      }

      // 参加者リストの初期化
      const initialParticipants: Participant[] = [{
        id: memberName, // メタデータのuserIdと一致させる
        nickname: nickname as string,
        isFacilitator: isFacilitatorBool,
        hasVoted: false,
      }]

      console.log('Initial participants:', initialParticipants)
      setParticipants(initialParticipants)
      setLocalMember(member)

      // 他の参加者の参加を監視
      newRoom.onMemberJoined.add(async (joinedMember: any) => {
        try {
          console.log('Member joined object:', joinedMember)
          console.log('Member joined id:', joinedMember.id)
          console.log('Member joined metadata:', joinedMember.metadata)
          const metadata = JSON.parse(joinedMember.metadata || '{}')
          console.log('Parsed metadata:', metadata)
          const newParticipant: Participant = {
            id: metadata.userId || joinedMember.id || `member-${Date.now()}`,
            nickname: metadata.nickname || 'Unknown',
            isFacilitator: metadata.isFacilitator || false,
            hasVoted: false,
          }
          console.log('Created participant:', newParticipant)
          setParticipants(prev => [...prev, newParticipant])
          console.log('新しい参加者が参加:', newParticipant.nickname)

          // 新しい参加者のデータストリームを購読
          const newMemberStreams = newRoom.publications.filter(pub =>
            pub.contentType === 'data' && pub.publisher.id === joinedMember.id
          )
          console.log('New member streams:', newMemberStreams.length)
          for (const publication of newMemberStreams) {
            console.log('Subscribing to new member stream from:', publication.publisher.id)
            const subscription = await member.subscribe(publication)
              ; (subscription.stream as any).onData?.add((data: any) => {
                try {
                  console.log('Raw new member data:', data)
                  const messageData = data.data || data
                  const message = JSON.parse(messageData)
                  console.log('Received new member message:', message)
                  handleDataMessage(message)
                } catch (err) {
                  console.error('新メンバーメッセージの解析エラー:', err, 'Raw data:', data)
                }
              })
          }
        } catch (err) {
          console.error('参加者情報の解析エラー:', err)
        }
      })

      // データストリームの公開を監視
      newRoom.onStreamPublished.add(async (event: any) => {
        console.log('Stream published:', event.publication.publisher.id, event.publication.contentType)
        if (event.publication.contentType === 'data' && event.publication.publisher.id !== member.id) {
          console.log('Subscribing to newly published stream from:', event.publication.publisher.id)
          const subscription = await member.subscribe(event.publication)
            ; (subscription.stream as any).onData?.add((data: any) => {
              try {
                console.log('Raw newly published stream data:', data)
                const messageData = data.data || data
                const message = JSON.parse(messageData)
                console.log('Received newly published stream message:', message)
                handleDataMessage(message)
              } catch (err) {
                console.error('新公開ストリームメッセージの解析エラー:', err, 'Raw data:', data)
              }
            })
        }
      })

      // 参加者の退出を監視
      newRoom.onMemberLeft.add((leftMember: any) => {
        setParticipants(prev => {
          const updated = prev.filter(p => p.id !== leftMember.id)
          console.log('参加者が退出:', leftMember.name)

          return updated
        })
      })

      // エラーハンドリング（try-catchで対応）
      console.log('SkyWay接続成功')

      console.log('SkyWay接続成功')

    } catch (err) {
      console.error('SkyWay/WebRTC接続エラー:', err)
      setError('ルームへの接続に失敗しました。ネットワークやAPIキーを確認してください。')
    } finally {
      setIsConnecting(false)
    }
  }, [roomId, nickname, isFacilitatorBool, isClient])

  // データメッセージの処理
  const handleDataMessage = useCallback((message: {
    type: string
    userId?: string
    point?: string
    taskText?: string
  }) => {
    console.log('Received message:', message)

    switch (message.type) {
      case 'vote':
        if (message.userId && message.point) {
          console.log('Processing vote:', message.userId, message.point)
          setParticipants(prev => {
            console.log('Current participants before update:', prev)
            const updated = prev.map(p => {
              if (p.id === message.userId) {
                console.log('Found matching participant:', p.nickname, 'updating vote to:', message.point)

                return { ...p, hasVoted: true, vote: message.point }
              }

              return p
            })
            console.log('Updated participants:', updated)

            return updated
          })
        }
        break

      case 'task':
        if (message.taskText) {
          setCurrentTask({
            id: Date.now().toString(),
            text: message.taskText,
            isRevealed: false,
            votes: {},
            comments: [],
          })
          // 投票状態をリセット
          setParticipants(prev => prev.map(p => ({ ...p, hasVoted: false, vote: undefined })))
          setSelectedCard('')
        }
        break

      case 'reveal':
        setCurrentTask(prev => prev ? { ...prev, isRevealed: true } : null)
        break

      case 'nextTask':
        setCurrentTask(null)
        setSelectedCard('')
        setParticipants(prev => prev.map(p => ({ ...p, hasVoted: false, vote: undefined })))
        break
    }
  }, [])

  // メッセージを送信する共通関数
  const sendMessage = useCallback((message: any) => {
    if (!dataStream) {
      console.error('データストリームが利用できません')

      return
    }

    try {
      dataStream.write(JSON.stringify(message))
      console.log('Message sent:', message)
    } catch (err) {
      console.error('メッセージ送信エラー:', err)
    }
  }, [dataStream, handleDataMessage])

  // 投票を送信
  const sendVote = useCallback(async (point: string) => {
    if (!localMember) return

    try {
      console.log('Sending vote:', point)
      // ローカルメンバーのメタデータからuserIdを取得
      const localMetadata = JSON.parse(localMember.metadata || '{}')
      const userId = localMetadata.userId || localMember.id

      const message = {
        type: 'vote',
        userId: userId,
        point,
      }

      // SkyWayでメッセージを送信
      sendMessage(message)

      // 選択したカードを設定（UI表示用）
      setSelectedCard(point)
    } catch (err) {
      console.error('投票送信エラー:', err)
    }
  }, [localMember, sendMessage])

  // タスクを送信（ファシリテーターのみ）
  const sendTask = useCallback(async () => {
    if (!taskText.trim() || !isFacilitatorBool) return

    try {
      console.log('Sending task:', taskText)
      const message = {
        type: 'task',
        taskText: taskText.trim(),
      }

      // SkyWayでメッセージを送信
      sendMessage(message)

      // ファシリテーター側でもローカルでタスクを設定
      setCurrentTask({
        id: Date.now().toString(),
        text: taskText.trim(),
        isRevealed: false,
        votes: {},
        comments: [],
      })
      // 投票状態をリセット
      setParticipants(prev => prev.map(p => ({ ...p, hasVoted: false, vote: undefined })))
      setSelectedCard('')

      setTaskText('')
    } catch (err) {
      console.error('タスク送信エラー:', err)
    }
  }, [taskText, isFacilitatorBool, sendMessage])

  // カードを公開（ファシリテーターのみ）
  const revealCards = useCallback(async () => {
    if (!isFacilitatorBool) return

    try {
      console.log('Revealing cards')
      const message = { type: 'reveal' }

      // SkyWayでメッセージを送信
      sendMessage(message)

      // ファシリテーター側でもローカルでカードを公開
      setCurrentTask(prev => prev ? { ...prev, isRevealed: true } : null)
    } catch (err) {
      console.error('カード公開エラー:', err)
    }
  }, [isFacilitatorBool, sendMessage])

  // 次のタスクへ（ファシリテーターのみ）
  const nextTask = useCallback(async () => {
    if (!isFacilitatorBool) return

    try {
      console.log('Moving to next task')
      const message = { type: 'nextTask' }

      // SkyWayでメッセージを送信
      sendMessage(message)

      // ファシリテーター側でもローカルで次のタスクに移動
      setCurrentTask(null)
      setSelectedCard('')
      setParticipants(prev => prev.map(p => ({ ...p, hasVoted: false, vote: undefined })))
    } catch (err) {
      console.error('次のタスクエラー:', err)
    }
  }, [isFacilitatorBool, sendMessage])

  // 平均ポイントの計算
  const calculateAverage = useCallback(() => {
    if (!currentTask || !currentTask.isRevealed) return null

    const validVotes = participants
      .filter(p => p.vote && p.vote !== '?' && p.vote !== '☕')
      .map(p => parseInt(p.vote!))

    if (validVotes.length === 0) return null

    const sum = validVotes.reduce((acc, vote) => acc + vote, 0)

    return Math.round((sum / validVotes.length) * 10) / 10
  }, [currentTask, participants])

  // 全員が投票したかチェック
  const allVoted = participants.length > 0 && participants.every(p => p.hasVoted)

  useEffect(() => {
    if (roomId && nickname) {
      connectToRoom()
    }
  }, [roomId, nickname, connectToRoom])

  return {
    roomId,
    nickname,
    isFacilitator: isFacilitatorBool,
    participants,
    currentTask,
    selectedCard,
    taskText,
    comment,
    isConnecting,
    error,
    allVoted,
    average: calculateAverage(),
    setTaskText,
    setComment,
    sendVote,
    sendTask,
    revealCards,
    nextTask,
  }
} 