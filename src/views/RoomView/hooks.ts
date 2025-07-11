import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/router'
import {
  nowInSec,
  SkyWayAuthToken,
  uuidV4,
  SkyWayRoom,
  SkyWayContext,
  SkyWayStreamFactory
} from '@skyway-sdk/room'

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

  const [room, setRoom] = useState<any>(null)
  const [localMember, setLocalMember] = useState<any>(null)
  const [dataStream, setDataStream] = useState<any>(null)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [currentTask, setCurrentTask] = useState<Task | null>(null)
  const [selectedCard, setSelectedCard] = useState<string>('')
  const [taskText, setTaskText] = useState('')
  const [comment, setComment] = useState('')
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isFacilitatorBool = isFacilitator === 'true'

  // SkyWayルームに接続
  const connectToRoom = useCallback(async () => {
    if (!roomId || !nickname) return

    setIsConnecting(true)
    setError(null)

    try {
      console.log('Connecting to SkyWay room:', roomId, 'as', nickname)

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

      // ルームメンバーとして参加
      const member = await newRoom.join({
        name: memberName,
        metadata: JSON.stringify({
          nickname: nickname,
          isFacilitator: isFacilitatorBool,
        }),
      })

      // データストリームを作成
      const stream = await SkyWayStreamFactory.createDataStream()
      await member.publish(stream)
      setDataStream(stream)

      // 参加者リストの初期化
      const initialParticipants: Participant[] = [{
        id: member.id,
        nickname: nickname as string,
        isFacilitator: isFacilitatorBool,
        hasVoted: false,
      }]

      setParticipants(initialParticipants)
      setRoom(newRoom)
      setLocalMember(member)

      // 他の参加者の参加を監視
      if (newRoom.on) {
        newRoom.on('memberJoined', (joinedMember: any) => {
          try {
            const metadata = JSON.parse(joinedMember.metadata || '{}')
            const newParticipant: Participant = {
              id: joinedMember.id,
              nickname: metadata.nickname || 'Unknown',
              isFacilitator: metadata.isFacilitator || false,
              hasVoted: false,
            }
            setParticipants(prev => [...prev, newParticipant])
            console.log('新しい参加者が参加:', newParticipant.nickname)
          } catch (err) {
            console.error('参加者情報の解析エラー:', err)
          }
        })

        // 参加者の退出を監視
        newRoom.on('memberLeft', (leftMember: any) => {
          setParticipants(prev => {
            const updated = prev.filter(p => p.id !== leftMember.id)
            console.log('参加者が退出:', leftMember.name)

            return updated
          })
        })

        // エラーハンドリング
        newRoom.on('error', (error: Error) => {
          console.error('SkyWayルームエラー:', error)
          setError('ルームでエラーが発生しました')
        })
      }

      if (member.on) {
        member.on('error', (error: Error) => {
          console.error('SkyWayメンバーエラー:', error)
          setError('接続でエラーが発生しました')
        })
      }

      console.log('SkyWay接続成功')

    } catch (err) {
      console.error('SkyWay/WebRTC接続エラー:', err)
      setError('ルームへの接続に失敗しました。ネットワークやAPIキーを確認してください。')
    } finally {
      setIsConnecting(false)
    }
  }, [roomId, nickname, isFacilitatorBool])

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
          setParticipants(prev =>
            prev.map(p =>
              p.id === message.userId
                ? { ...p, hasVoted: true, vote: message.point }
                : p
            )
          )
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

      // ローカルでもメッセージを処理（デバッグ用）
      setTimeout(() => {
        handleDataMessage(message)
      }, 100)
    } catch (err) {
      console.error('メッセージ送信エラー:', err)
    }
  }, [dataStream, handleDataMessage])

  // 投票を送信
  const sendVote = useCallback(async (point: string) => {
    if (!localMember) return

    try {
      console.log('Sending vote:', point)
      const message = {
        type: 'vote',
        userId: localMember.id,
        point,
      }

      // SkyWayでメッセージを送信
      sendMessage(message)

      // ローカル参加者の投票状態を更新
      setParticipants(prev =>
        prev.map(p =>
          p.id === localMember.id
            ? { ...p, hasVoted: true, vote: point }
            : p
        )
      )
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