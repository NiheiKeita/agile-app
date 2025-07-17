import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import {
  SkyWayContext,
  SkyWayRoom,
  SkyWayStreamFactory,
  LocalDataStream,
  RemoteDataStream,
  RoomPublication,
  RoomMember,
} from '@skyway-sdk/room'
import { DataStreamMessageType } from '@skyway-sdk/core'

export interface TradeoffParticipant {
  id: string
  nickname: string
  isFacilitator: boolean
  value: number // スライダー値
}

export interface TradeoffTheme {
  leftLabel: string
  rightLabel: string
}

export const useTradeoffRoomView = () => {
  const router = useRouter()
  const { roomId, nickname, isFacilitator } = router.query

  const [participants, setParticipants] = useState<TradeoffParticipant[]>([])
  const [theme, setTheme] = useState<TradeoffTheme>({ leftLabel: 'スピード', rightLabel: 'クオリティ' })
  const [sliderValue, setSliderValue] = useState(50)
  const [locked, setLocked] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isClient, setIsClient] = useState(false)

  // SkyWay用
  const dataStreamRef = useRef<LocalDataStream | null>(null)
  const localMemberRef = useRef<RoomMember | null>(null)
  const roomRef = useRef<InstanceType<typeof SkyWayRoom> | null>(null)

  const isFacilitatorBool = isFacilitator === 'true'

  // クライアントサイド判定
  useEffect(() => {
    setIsClient(true)
  }, [])

  // SkyWayルーム接続
  useEffect(() => {
    if (!roomId || !nickname || !isClient) return
    if (typeof roomId !== 'string' || typeof nickname !== 'string') return
    let isUnmounted = false
    setIsConnecting(true)
    setError(null)

    const connect = async () => {
      try {
        // SkyWay SDKを動的import
        const res = await fetch('/api/skyway-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ channelName: roomId, memberName: nickname })
        })
        const { token } = await res.json()
        const context = await SkyWayContext.Create(token)
        const room = await SkyWayRoom.FindOrCreate(context, { type: 'p2p', name: (roomId as string) || '' })
        roomRef.current = room
        // メンバー名は一意に
        const memberName = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        const memberMetadata = {
          userId: memberName,
          nickname,
          isFacilitator: isFacilitatorBool,
        }
        const member = await room.join({ name: memberName, metadata: JSON.stringify(memberMetadata) })
        localMemberRef.current = member
        // データストリーム
        const stream: LocalDataStream = await SkyWayStreamFactory.createDataStream()
        await member.publish(stream)
        dataStreamRef.current = stream
        // 参加者初期化
        setParticipants([{ id: memberName, nickname: nickname as string, isFacilitator: isFacilitatorBool, value: 50 }])
        // 既存メンバー
        for (const m of room.members) {
          if (m.id !== member.id && m.metadata) {
            try {
              const meta = JSON.parse(m.metadata)
              setParticipants(prev => {
                if (prev.find(p => p.id === meta.userId)) return prev

                return [...prev, { id: meta.userId, nickname: meta.nickname, isFacilitator: meta.isFacilitator, value: 50 }]
              })
            } catch (e) { console.error(e) }
          }
        }
        // データ受信（自分のLocalDataStreamにはonDataは不要）
        // 他のメンバーのデータストリーム購読
        for (const pub of room.publications.filter((p: RoomPublication) => p.contentType === 'data')) {
          if (pub.publisher.id !== member.id) {
            const { stream }: { stream: RemoteDataStream } = await member.subscribe(pub)
            stream.onData.add((data: DataStreamMessageType) => {
              if (typeof data === 'string') {
                try {
                  const msg = JSON.parse(data)
                  handleDataMessage(msg)
                } catch (e) { console.error(e) }
              }
            })
          }
        }
        // 新規参加者
        room.onMemberJoined.add((event: { member: RoomMember }) => {
          const joined = event.member
          if (joined.metadata) {
            try {
              const meta = JSON.parse(joined.metadata)
              setParticipants(prev => {
                if (prev.find(p => p.id === meta.userId)) return prev

                return [...prev, { id: meta.userId, nickname: meta.nickname, isFacilitator: meta.isFacilitator, value: 50 }]
              })
            } catch (e) { console.error(e) }
          }
        })
        // 退出
        room.onMemberLeft.add((event: { member: RoomMember }) => {
          const left = event.member
          setParticipants(prev => prev.filter(p => p.id !== left.id))
        })
      } catch (e: any) {
        if (!isUnmounted) setError('SkyWay接続エラー: ' + (e?.message || ''))
      } finally {
        if (!isUnmounted) setIsConnecting(false)
      }
    }
    connect()

    return () => { isUnmounted = true }
  }, [roomId, nickname, isFacilitatorBool, isClient])

  // データメッセージ処理
  const handleDataMessage = (msg: any) => {
    if (msg.type === 'slide' && msg.userId) {
      setParticipants(prev => prev.map(p => p.id === msg.userId ? { ...p, value: msg.value } : p))
    } else if (msg.type === 'theme' && msg.leftLabel && msg.rightLabel) {
      setTheme({ leftLabel: msg.leftLabel, rightLabel: msg.rightLabel })
    } else if (msg.type === 'lock' && typeof msg.locked === 'boolean') {
      setLocked(msg.locked)
    }
  }

  // スライダー変更時に全員に送信
  useEffect(() => {
    if (!isClient || !localMemberRef.current || !dataStreamRef.current) return
    if (!localMemberRef.current.metadata) return
    const localId = JSON.parse(localMemberRef.current.metadata).userId
    if (typeof localId !== 'string') return
    const msg = { type: 'slide', userId: localId, value: sliderValue }
    dataStreamRef.current.write(JSON.stringify(msg))
  }, [sliderValue])

  // テーマ変更時（ファシリテーターのみ）
  const sendTheme = () => {
    if (!isClient || !localMemberRef.current || !dataStreamRef.current) return
    if (!isFacilitatorBool) return
    const msg = { type: 'theme', leftLabel: theme.leftLabel, rightLabel: theme.rightLabel }
    dataStreamRef.current.write(JSON.stringify(msg))
  }

  // ロック切り替え時（ファシリテーターのみ）
  const sendLock = (locked: boolean) => {
    if (!isClient || !localMemberRef.current || !dataStreamRef.current) return
    if (!isFacilitatorBool) return
    const msg = { type: 'lock', locked }
    dataStreamRef.current.write(JSON.stringify(msg))
  }

  return {
    roomId,
    nickname,
    isFacilitator: isFacilitatorBool,
    participants,
    theme,
    sliderValue,
    locked,
    isConnecting,
    error,
    setTheme: (t: TradeoffTheme) => {
      setTheme(t)
      sendTheme()
    },
    setSliderValue,
    setLocked: (l: boolean) => {
      setLocked(l)
      sendLock(l)
    },
  }
} 