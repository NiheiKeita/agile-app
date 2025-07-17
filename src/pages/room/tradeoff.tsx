import { useState } from 'react'
import { useRouter } from 'next/router'

export default function TradeoffRoomTop() {
  const router = useRouter()
  const [nickname, setNickname] = useState('')
  const [roomId, setRoomId] = useState('')

  // 8文字のランダムなID生成
  const generateRoomId = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let result = ''
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }

    return result
  }

  // ルーム作成
  const handleCreateRoom = () => {
    const newRoomId = 'tradeoff-' + generateRoomId()
    const name = nickname || 'ファシリテーター'
    router.push(`/room/tradeoff_session?roomId=${newRoomId}&nickname=${encodeURIComponent(name)}&isFacilitator=true`)
  }

  // ルーム参加
  const handleJoinRoom = () => {
    if (!roomId.trim() || !nickname.trim()) return
    router.push(`/room/tradeoff_session?roomId=${roomId}&nickname=${encodeURIComponent(nickname)}&isFacilitator=false`)
  }

  const canJoinRoom = roomId.trim() !== '' && nickname.trim() !== ''

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-pink-50 to-yellow-100 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-3xl font-bold text-gray-900">トレードオフスライダー</h1>
          <p className="text-gray-600">価値観や優先順位をリアルタイムで可視化し、チームで共有しましょう</p>
        </div>
        <div className="mb-8 rounded-lg bg-pink-50 p-4">
          <p className="text-center text-sm text-pink-800">
            例えば「スピード vs クオリティ」など、どちらを重視するかをリアルタイムで議論できます
          </p>
        </div>
        <div className="mb-6">
          <label htmlFor="nickname" className="mb-2 block text-sm font-medium text-gray-700">ニックネーム</label>
          <input
            id="nickname"
            type="text"
            value={nickname}
            onChange={e => setNickname(e.target.value)}
            placeholder="あなたの名前を入力"
            className="w-full rounded-lg border border-gray-300 px-4 py-3 transition-colors focus:border-transparent focus:ring-2 focus:ring-pink-500"
          />
        </div>
        <div className="mb-8">
          <button
            onClick={handleCreateRoom}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-pink-600 px-6 py-3 font-semibold text-white transition-colors duration-200 hover:bg-pink-700"
          >
            <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            ルームを作成する
          </button>
        </div>
        <div className="relative mb-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white px-2 text-gray-500">または</span>
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <label htmlFor="roomId" className="mb-2 block text-sm font-medium text-gray-700">ルームID</label>
            <input
              id="roomId"
              type="text"
              value={roomId}
              onChange={e => setRoomId(e.target.value)}
              placeholder="ルームIDを入力してください"
              className="w-full rounded-lg border border-gray-300 px-4 py-3 uppercase transition-colors focus:border-transparent focus:ring-2 focus:ring-pink-500"
            />
          </div>
          <button
            onClick={handleJoinRoom}
            disabled={!canJoinRoom}
            className={`flex w-full items-center justify-center gap-2 rounded-lg px-6 py-3 font-semibold transition-colors duration-200 ${canJoinRoom ? 'bg-yellow-500 text-white hover:bg-yellow-600' : 'cursor-not-allowed bg-gray-300 text-gray-500'}`}
          >
            <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
            </svg>
            参加する
          </button>
        </div>
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500">
            SkyWayを使用したリアルタイム同期で、チーム全体の価値観を可視化できます
          </p>
        </div>
      </div>
    </div>
  )
} 