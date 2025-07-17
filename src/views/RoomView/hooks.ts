import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/router'

export interface Participant {
  id: string
  nickname: string
  isFacilitator: boolean
  hasVoted: boolean
  vote?: string
  disabled?: boolean // 追加: 無効状態
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
      console.log('=== 参加者のメタデータ送信処理 ===')
      console.log('作成したメタデータ:', memberMetadata)
      console.log('メタデータをJSON文字列化:', JSON.stringify(memberMetadata))
      console.log('参加者名:', memberName)
      console.log('ニックネーム:', nickname)
      console.log('ファシリテーター:', isFacilitatorBool)

      // ルームメンバーとして参加
      const member = await newRoom.join({
        name: memberName,
        metadata: JSON.stringify(memberMetadata),
      })

      console.log('=== ルーム参加完了 ===')
      console.log('メンバーID:', member.id)
      console.log('実際に送信されたメタデータ:', member.metadata)
      console.log('メタデータの型:', typeof member.metadata)
      console.log('メタデータの長さ:', member.metadata ? member.metadata.length : 0)
      console.log('メタデータが空かどうか:', !member.metadata)
      console.log('メタデータがnullかどうか:', member.metadata === null)
      console.log('メタデータがundefinedかどうか:', member.metadata === undefined)

      // メタデータを再パースして内容を確認
      if (member.metadata) {
        try {
          const parsedMetadata = JSON.parse(member.metadata)
          console.log('再パースしたメタデータ:', parsedMetadata)
          console.log('再パースしたメタデータのキー:', Object.keys(parsedMetadata))
        } catch (err) {
          console.error('メタデータの再パースエラー:', err)
        }
      }

      // データストリームを作成
      const stream = await SkyWayStreamFactory.createDataStream()
      await member.publish(stream)
      setDataStream(stream)

        // データストリームの受信処理を設定（型アサーションで回避）
        ; (stream as any).onData?.add((data: any) => {
          try {
            console.log('=== データストリーム受信処理開始 ===')
            console.log('生のデータストリームデータ:', data)
            console.log('データの型:', typeof data)
            console.log('データの構造:', Object.keys(data || {}))

            const messageData = data.data || data
            console.log('メッセージデータ:', messageData)
            console.log('メッセージデータの型:', typeof messageData)

            const message = JSON.parse(messageData)
            console.log('パースされたメッセージ:', message)
            console.log('メッセージの型:', message.type)
            console.log('=== データストリーム受信処理完了 ===')

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

      console.log('=== 既存参加者のメタデータ受信処理 ===')
      console.log('既存参加者数:', existingMembers.length)
      for (const existingMember of existingMembers) {
        try {
          console.log('--- 既存参加者の詳細 ---')
          console.log('参加者オブジェクト:', existingMember)
          console.log('参加者ID:', existingMember.id)
          console.log('受信したメタデータ:', existingMember.metadata)
          console.log('メタデータの型:', typeof existingMember.metadata)
          console.log('メタデータの長さ:', existingMember.metadata ? existingMember.metadata.length : 0)

          console.log('=== メタデータの詳細解析 ===')
          console.log('生のメタデータ文字列:', existingMember.metadata)
          console.log('メタデータが空かどうか:', !existingMember.metadata)
          console.log('メタデータがnullかどうか:', existingMember.metadata === null)
          console.log('メタデータがundefinedかどうか:', existingMember.metadata === undefined)

          const metadata = JSON.parse(existingMember.metadata || '{}')
          console.log('パース後のメタデータ:', metadata)
          console.log('メタデータのuserId:', metadata.userId)
          console.log('メタデータのnickname:', metadata.nickname)
          console.log('メタデータのisFacilitator:', metadata.isFacilitator)
          console.log('メタデータのキー一覧:', Object.keys(metadata))

          const existingParticipant: Participant = {
            id: metadata.userId || existingMember.id || `member-${Date.now()}`,
            nickname: metadata.nickname || 'Unknown',
            isFacilitator: metadata.isFacilitator || false,
            hasVoted: false,
          }
          console.log('作成された参加者オブジェクト:', existingParticipant)
          console.log('最終的な参加者ID:', existingParticipant.id)
          console.log('最終的なニックネーム:', existingParticipant.nickname)
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
          console.log('=== 新しい参加者のメタデータ受信処理 ===')
          console.log('参加者オブジェクト:', joinedMember)

          // SkyWayの最新APIでは、メンバー情報がネストされている可能性がある
          const actualMember = joinedMember.member || joinedMember
          console.log('実際のメンバーオブジェクト:', actualMember)
          console.log('参加者ID:', actualMember.id)
          console.log('受信したメタデータ:', actualMember.metadata)
          console.log('メタデータの型:', typeof actualMember.metadata)
          console.log('メタデータの長さ:', actualMember.metadata ? actualMember.metadata.length : 0)

          console.log('=== メタデータの詳細解析 ===')
          console.log('生のメタデータ文字列:', actualMember.metadata)
          console.log('メタデータが空かどうか:', !actualMember.metadata)
          console.log('メタデータがnullかどうか:', actualMember.metadata === null)
          console.log('メタデータがundefinedかどうか:', actualMember.metadata === undefined)

          const metadata = JSON.parse(actualMember.metadata || '{}')
          console.log('パース後のメタデータ:', metadata)
          console.log('メタデータのuserId:', metadata.userId)
          console.log('メタデータのnickname:', metadata.nickname)
          console.log('メタデータのisFacilitator:', metadata.isFacilitator)
          console.log('メタデータのキー一覧:', Object.keys(metadata))

          const newParticipant: Participant = {
            id: metadata.userId || actualMember.id || `member-${Date.now()}`,
            nickname: metadata.nickname || 'Unknown',
            isFacilitator: metadata.isFacilitator || false,
            hasVoted: false,
          }
          console.log('作成された参加者オブジェクト:', newParticipant)
          console.log('最終的な参加者ID:', newParticipant.id)
          console.log('最終的なニックネーム:', newParticipant.nickname)
          setParticipants(prev => [...prev, newParticipant])
          console.log('新しい参加者が参加:', newParticipant.nickname)

          // 新しい参加者のデータストリームを購読
          const newMemberStreams = newRoom.publications.filter(pub =>
            pub.contentType === 'data' && pub.publisher.id === actualMember.id
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
          console.log('=== 投票受信処理開始 ===')
          console.log('受信した投票メッセージ:', message)
          console.log('投票者ID:', message.userId)
          console.log('投票ポイント:', message.point)

          setParticipants(prev => {
            console.log('更新前の参加者リスト:', prev)
            console.log('参加者IDの比較:')
            prev.forEach(p => {
              console.log(`参加者: ${p.nickname}, ID: ${p.id}, 一致: ${p.id === message.userId}`)
            })

            const updated = prev.map(p => {
              if (p.id === message.userId) {
                console.log('一致する参加者を発見:', p.nickname, '投票を更新:', message.point)

                return { ...p, hasVoted: true, vote: message.point }
              }

              return p
            })

            console.log('更新後の参加者リスト:', updated)
            console.log('=== 投票受信処理完了 ===')

            return updated
          })
        } else {
          console.log('投票メッセージが不完全:', message)
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

      case 'disable':
        if (message.userId) {
          setParticipants(prev => prev.map(p =>
            p.id === message.userId ? { ...p, disabled: true } : p
          ))
        }
        break
      case 'enable':
        if (message.userId) {
          setParticipants(prev => prev.map(p =>
            p.id === message.userId ? { ...p, disabled: false } : p
          ))
        }
        break
    }
  }, [])

  // メッセージを送信する共通関数
  const sendMessage = useCallback((message: any) => {
    console.log('=== メッセージ送信処理開始 ===')
    console.log('送信するメッセージ:', message)
    console.log('データストリームの状態:', dataStream ? '利用可能' : '利用不可')

    if (!dataStream) {
      console.error('データストリームが利用できません')

      return
    }

    try {
      const messageString = JSON.stringify(message)
      console.log('JSON文字列化されたメッセージ:', messageString)
      dataStream.write(messageString)
      console.log('メッセージ送信成功:', message)
      console.log('=== メッセージ送信処理完了 ===')
    } catch (err) {
      console.error('メッセージ送信エラー:', err)
    }
  }, [dataStream, handleDataMessage])

  // 投票を送信
  const sendVote = useCallback(async (point: string) => {
    if (!localMember) return

    try {
      console.log('=== 投票送信処理開始 ===')
      console.log('投票ポイント:', point)
      console.log('ローカルメンバー:', localMember)
      console.log('ローカルメンバーのメタデータ:', localMember.metadata)

      // ローカルメンバーのメタデータからuserIdを取得
      const localMetadata = JSON.parse(localMember.metadata || '{}')
      const userId = localMetadata.userId || localMember.id

      console.log('パースしたローカルメタデータ:', localMetadata)
      console.log('使用するuserId:', userId)

      const message = {
        type: 'vote',
        userId: userId,
        point,
      }

      console.log('送信するメッセージ:', message)

      // SkyWayでメッセージを送信
      sendMessage(message)

      // 選択したカードを設定（UI表示用）
      setSelectedCard(point)

      // ローカルでも投票状態を更新（自分自身のメッセージを受信しない場合の対策）
      setParticipants(prev => {
        console.log('=== ローカル投票状態更新開始 ===')
        console.log('更新前の参加者リスト:', prev)
        console.log('更新対象のuserId:', userId)

        const updated = prev.map(p => {
          if (p.id === userId) {
            console.log('ローカルで投票状態を更新:', p.nickname, '投票:', point)

            return { ...p, hasVoted: true, vote: point }
          }

          return p
        })

        console.log('更新後の参加者リスト:', updated)
        console.log('=== ローカル投票状態更新完了 ===')

        return updated
      })

      console.log('=== 投票送信処理完了 ===')
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
  const allVoted = participants.filter(p => !p.disabled).length > 0 && participants.filter(p => !p.disabled).every(p => p.hasVoted)

  // 参加者を無効化する関数
  const onDisableParticipant = useCallback((participantId: string) => {
    // SkyWayで全員に通知
    sendMessage({ type: 'disable', userId: participantId })
    // ローカルも即時反映
    setParticipants(prev => prev.map(p =>
      p.id === participantId ? { ...p, disabled: true } : p
    ))
  }, [sendMessage])

  // 参加者を有効化する関数
  const onEnableParticipant = useCallback((participantId: string) => {
    sendMessage({ type: 'enable', userId: participantId })
    setParticipants(prev => prev.map(p =>
      p.id === participantId ? { ...p, disabled: false } : p
    ))
  }, [sendMessage])

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
    onDisableParticipant,
    onEnableParticipant,
  }
} 