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


  const [room, setRoom] = useState<any>(null)
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

      // SkyWayの初期化
      const { SkyWayRoom, SkyWayContext } = await import('@skyway-sdk/room')

      // SkyWayコンテキストの作成
      const context = await SkyWayContext.Create(
        process.env.NEXT_PUBLIC_SKYWAY_TOKEN || ''
      )

      // ルームの作成または参加
      const newRoom = await SkyWayRoom.Create(context, {
        type: 'p2p',
        name: roomId as string,
      }) as any

      // ルームメンバーとして参加
      const member = await newRoom.join({
        name: nickname as string,
        metadata: JSON.stringify({
          nickname: nickname,
          isFacilitator: isFacilitatorBool,
        }),
      }) as any

      // 参加者リストの初期化
      const initialParticipants: Participant[] = [{
        id: member.id,
        nickname: nickname as string,
        isFacilitator: isFacilitatorBool,
        hasVoted: false,
      }]

      setParticipants(initialParticipants)
      setRoom(newRoom)

      // データメッセージ受信の設定
      member.on('data', (data: any) => {
        try {
          const message = JSON.parse(data.data)
          handleDataMessage(message)
        } catch (err) {
          console.error('データメッセージの解析エラー:', err)
        }
      })

      // 他の参加者の参加を監視
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
      newRoom.on('error', (error: any) => {
        console.error('SkyWayルームエラー:', error)
        setError('ルームでエラーが発生しました')
      })

      member.on('error', (error: any) => {
        console.error('SkyWayメンバーエラー:', error)
        setError('接続でエラーが発生しました')
      })

      console.log('SkyWay接続成功')

    } catch (err) {
      console.error('SkyWay/WebRTC接続エラー:', err)
      setError('ルームへの接続に失敗しました。ネットワークやAPIキーを確認してください。')
    } finally {
      setIsConnecting(false)
    }
  }, [roomId, nickname, isFacilitatorBool])

  // データメッセージの処理
  const handleDataMessage = useCallback((message: any) => {
    console.log('Received message:', message)

    switch (message.type) {
      case 'vote':
        setParticipants(prev =>
          prev.map(p =>
            p.id === message.userId
              ? { ...p, hasVoted: true, vote: message.point }
              : p
          )
        )
        break

      case 'task':
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

  // 投票を送信
  const sendVote = useCallback(async (point: string) => {
    if (!room) return

    try {
      console.log('Sending vote:', point)
      const message = {
        type: 'vote',
        userId: 'local-user', // 実際のSkyWayではmember.idを使用
        point,
      }

      // SkyWayでメッセージを送信
      await (room as any).localMember?.publish(JSON.stringify(message))
      setSelectedCard(point)

      // ローカル参加者の投票状態を更新
      setParticipants(prev =>
        prev.map(p =>
          p.id === 'local-user'
            ? { ...p, hasVoted: true, vote: point }
            : p
        )
      )
    } catch (err) {
      console.error('投票送信エラー:', err)
    }
  }, [room])

  // タスクを送信（ファシリテーターのみ）
  const sendTask = useCallback(async () => {
    if (!room || !taskText.trim() || !isFacilitatorBool) return

    try {
      console.log('Sending task:', taskText)
      const message = {
        type: 'task',
        taskText: taskText.trim(),
      }

      // SkyWayでメッセージを送信
      await (room as any).localMember?.publish(JSON.stringify(message))
      setTaskText('')
    } catch (err) {
      console.error('タスク送信エラー:', err)
    }
  }, [room, taskText, isFacilitatorBool])

  // カードを公開（ファシリテーターのみ）
  const revealCards = useCallback(async () => {
    if (!room || !isFacilitatorBool) return

    try {
      console.log('Revealing cards')
      const message = { type: 'reveal' }
      await (room as any).localMember?.publish(JSON.stringify(message))
    } catch (err) {
      console.error('カード公開エラー:', err)
    }
  }, [room, isFacilitatorBool])

  // 次のタスクへ（ファシリテーターのみ）
  const nextTask = useCallback(async () => {
    if (!room || !isFacilitatorBool) return

    try {
      console.log('Moving to next task')
      const message = { type: 'nextTask' }
      await (room as any).localMember?.publish(JSON.stringify(message))
    } catch (err) {
      console.error('次のタスクエラー:', err)
    }
  }, [room, isFacilitatorBool])

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