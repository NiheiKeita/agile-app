import React from 'react'
import { useTopView } from './hooks'

export function TopView() {
  const {
    formData,
    updateFormData,
    handleCreateRoom,
    handleJoinRoom,
    canJoinRoom,
  } = useTopView()

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        {/* ヘッダー */}
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-3xl font-bold text-gray-900">
            プランニングポーカー
          </h1>
          <p className="text-gray-600">
            アジャイル開発のストーリーポイント見積もりを効率的に行いましょう
          </p>
        </div>

        {/* 説明文 */}
        <div className="mb-8 rounded-lg bg-blue-50 p-4">
          <p className="text-center text-sm text-blue-800">
            プランニングポーカーを始めるには、まずルームを作成してください
          </p>
        </div>

        {/* ニックネーム入力 */}
        <div className="mb-6">
          <label htmlFor="nickname" className="mb-2 block text-sm font-medium text-gray-700">
            ニックネーム
          </label>
          <input
            id="nickname"
            type="text"
            value={formData.nickname}
            onChange={(e) => updateFormData('nickname', e.target.value)}
            placeholder="あなたの名前を入力"
            className="w-full rounded-lg border border-gray-300 px-4 py-3 transition-colors focus:border-transparent focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* ルーム作成ボタン */}
        <div className="mb-8">
          <button
            onClick={handleCreateRoom}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition-colors duration-200 hover:bg-blue-700"
          >
            <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            ルームを作成する
          </button>
        </div>

        {/* 区切り線 */}
        <div className="relative mb-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white px-2 text-gray-500">または</span>
          </div>
        </div>

        {/* ルーム参加フォーム */}
        <div className="space-y-4">
          <div>
            <label htmlFor="roomId" className="mb-2 block text-sm font-medium text-gray-700">
              ルームID
            </label>
            <input
              id="roomId"
              type="text"
              value={formData.roomId}
              onChange={(e) => updateFormData('roomId', e.target.value.toUpperCase())}
              placeholder="ルームIDを入力してください"
              className="w-full rounded-lg border border-gray-300 px-4 py-3 uppercase transition-colors focus:border-transparent focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            onClick={handleJoinRoom}
            disabled={!canJoinRoom}
            className={`flex w-full items-center justify-center gap-2 rounded-lg px-6 py-3 font-semibold transition-colors duration-200 ${canJoinRoom
              ? 'bg-green-600 text-white hover:bg-green-700'
              : 'cursor-not-allowed bg-gray-300 text-gray-500'
              }`}
          >
            <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
            </svg>
            参加する
          </button>
        </div>

        {/* フッター */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500">
            SkyWayを使用したリアルタイム同期で、チーム全体の見積もりを効率的に行えます
          </p>
        </div>
      </div>
    </div>
  )
}
