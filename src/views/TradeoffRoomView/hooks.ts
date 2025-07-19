import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import { LocalDataStream, RoomMember } from '@skyway-sdk/room'

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
  const roomRef = useRef<any | null>(null)

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
        const {
          nowInSec,
          SkyWayAuthToken,
          uuidV4,
          SkyWayRoom,
          SkyWayContext,
          SkyWayStreamFactory
        } = await import('@skyway-sdk/room')

        // SkyWayトークンの生成（RoomViewと同じ方法）
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

        // 既存の参加者を取得
        console.log('Room members:', room.members)
        console.log('Room members length:', room.members.length)

        // メンバー情報の取得方法を試行
        let existingMembers: any[] = []
        if (room.members && room.members.length > 0) {
          existingMembers = room.members.filter((m: any) => m.id !== member.id)
        } else if ((room as any).members) {
          existingMembers = (room as any).members.filter((m: any) => m.id !== member.id)
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

            const existingParticipant: TradeoffParticipant = {
              id: metadata.userId || existingMember.id || `member-${Date.now()}`,
              nickname: metadata.nickname || 'Unknown',
              isFacilitator: metadata.isFacilitator || false,
              value: 50,
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
        const existingStreams = room.publications.filter(pub => pub.contentType === 'data')
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
        // 他の参加者の参加を監視
        room.onMemberJoined.add(async (joinedMember: any) => {
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

            const newParticipant: TradeoffParticipant = {
              id: metadata.userId || actualMember.id || `member-${Date.now()}`,
              nickname: metadata.nickname || 'Unknown',
              isFacilitator: metadata.isFacilitator || false,
              value: 50,
            }
            console.log('作成された新しい参加者オブジェクト:', newParticipant)
            console.log('最終的な参加者ID:', newParticipant.id)
            console.log('最終的なニックネーム:', newParticipant.nickname)
            setParticipants(prev => [...prev, newParticipant])
          } catch (err) {
            console.error('新しい参加者情報の解析エラー:', err)
          }
        })

        // データストリームの公開を監視
        room.onStreamPublished.add(async (event: any) => {
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
        room.onMemberLeft.add((leftMember: any) => {
          setParticipants(prev => {
            const updated = prev.filter(p => p.id !== leftMember.id)
            console.log('参加者が退出:', leftMember.name)

            return updated
          })
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