import React, { useState } from 'react'
import { useRoomView, POINT_CARDS } from './hooks'

export function RoomView() {
  const {
    roomId,
    nickname,
    isFacilitator,
    participants,
    currentTask,
    selectedCard,
    taskText,
    isConnecting,
    error,
    allVoted,
    average,
    setTaskText,
    sendVote,
    sendTask,
    revealCards,
    nextTask,
  } = useRoomView()

  const [inputNickname, setInputNickname] = useState('')
  const [isJoining, setIsJoining] = useState(false)

  // 名前入力画面
  if (!nickname) {
    const handleJoinRoom = async () => {
      if (!inputNickname.trim()) {
        alert('ニックネームを入力してください')

        return
      }

      setIsJoining(true)
      try {
        // URLパラメータを更新してルームに参加
        const url = new URL(window.location.href)
        url.searchParams.set('nickname', inputNickname.trim())
        url.searchParams.set('isFacilitator', 'false')
        window.history.replaceState({}, '', url.toString())

        // ページをリロードして新しいパラメータで初期化
        window.location.reload()
      } catch (err) {
        console.error('ルーム参加エラー:', err)
        alert('ルームへの参加に失敗しました')
        setIsJoining(false)
      }
    }

    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
          <div className="mb-6 text-center">
            <h1 className="mb-2 text-2xl font-bold text-gray-900">プランニングポーカー</h1>
            <p className="text-gray-600">ルームに参加するにはニックネームを入力してください</p>
          </div>

          <div className="mb-4">
            <label htmlFor="nickname" className="mb-2 block text-sm font-medium text-gray-700">
              ニックネーム
            </label>
            <input
              id="nickname"
              type="text"
              value={inputNickname}
              onChange={(e) => setInputNickname(e.target.value)}
              placeholder="あなたの名前を入力"
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
              onKeyPress={(e) => e.key === 'Enter' && handleJoinRoom()}
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => window.location.href = '/'}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
            >
              戻る
            </button>
            <button
              onClick={handleJoinRoom}
              disabled={!inputNickname.trim() || isJoining}
              className={`flex-1 rounded-lg px-4 py-2 font-medium text-white transition-colors ${inputNickname.trim() && !isJoining
                ? 'bg-blue-600 hover:bg-blue-700'
                : 'cursor-not-allowed bg-gray-300 text-gray-500'
                }`}
            >
              {isJoining ? '参加中...' : '参加する'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // URL共有機能
  const shareRoomUrl = async () => {
    const roomUrl = `${window.location.origin}/room/${roomId}`
    try {
      await navigator.clipboard.writeText(roomUrl)
      alert('ルームURLをクリップボードにコピーしました！')
    } catch (err) {
      console.error('クリップボードへのコピーに失敗しました:', err)
      // フォールバック: テキストエリアを使用
      const textArea = document.createElement('textarea')
      textArea.value = roomUrl
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      alert('ルームURLをクリップボードにコピーしました！')
    }
  }

  if (isConnecting) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="mx-auto mb-4 size-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
          <p className="text-gray-600">ルームに接続中...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="w-full max-w-md rounded-lg bg-white p-6 text-center">
          <div className="mb-4 text-red-500">
            <svg className="mx-auto size-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="mb-2 text-xl font-semibold text-gray-900">接続エラー</h2>
          <p className="mb-4 text-gray-600">{error}</p>
          <button
            onClick={() => window.location.href = '/'}
            className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            トップに戻る
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* ヘッダー */}
      <div className="border-b bg-white shadow-sm">
        <div className="mx-auto max-w-4xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">プランニングポーカー</h1>
              <p className="text-sm text-gray-600">
                ルームID: {roomId} | {nickname}
                {isFacilitator && <span className="ml-2 rounded bg-blue-100 px-2 py-1 text-xs text-blue-800">ファシリテーター</span>}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <p className="text-sm text-gray-600">参加者: {participants.length}人</p>
              {isFacilitator && (
                <button
                  onClick={shareRoomUrl}
                  className="flex items-center gap-2 rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700"
                >
                  <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                  </svg>
                  URL共有
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-6">
        {/* 参加者一覧 */}
        <div className="mb-6 rounded-lg bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-lg font-semibold text-gray-900">参加者</h2>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {participants.map((participant) => (
              <div
                key={participant.id}
                className={`rounded-lg border p-3 ${participant.hasVoted
                  ? 'border-green-200 bg-green-50'
                  : 'border-gray-200 bg-gray-50'
                  }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900">
                    {participant.nickname}
                  </span>
                  {participant.hasVoted && (
                    <span className="text-green-600">
                      <svg className="size-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </span>
                  )}
                </div>
                {participant.isFacilitator && (
                  <span className="text-xs text-blue-600">ファシリテーター</span>
                )}
                {participant.hasVoted && (
                  <div className="mt-2 text-center">
                    <span className="text-xs text-gray-500">投票済み</span>
                  </div>
                )}
              </div>
            ))}
          </div>
          {currentTask && !currentTask.isRevealed && (
            <div className="mt-4 rounded-lg bg-blue-50 p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-blue-900">
                  投票状況: {participants.filter(p => p.hasVoted).length} / {participants.length} 人
                </span>
                {allVoted && (
                  <span className="text-sm font-bold text-green-600">
                    全員投票完了！
                  </span>
                )}
              </div>
              <div className="mt-2 h-2 w-full rounded-full bg-blue-200">
                <div
                  className="h-2 rounded-full bg-green-500 transition-all duration-300"
                  style={{ width: `${(participants.filter(p => p.hasVoted).length / participants.length) * 100}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>

        {/* タスク入力（ファシリテーターのみ） */}
        {isFacilitator && (
          <div className="mb-6 rounded-lg bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-lg font-semibold text-gray-900">タスクを設定</h2>
            <div className="flex gap-3">
              <input
                type="text"
                value={taskText}
                onChange={(e) => setTaskText(e.target.value)}
                placeholder="タスク名を入力してください"
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={sendTask}
                disabled={!taskText.trim()}
                className={`rounded-lg px-6 py-2 font-medium transition-colors ${taskText.trim()
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'cursor-not-allowed bg-gray-300 text-gray-500'
                  }`}
              >
                送信
              </button>
            </div>
          </div>
        )}

        {/* 現在のタスク */}
        {currentTask && (
          <div className="mb-6 rounded-lg bg-white p-4 shadow-sm">
            <h2 className="mb-2 text-lg font-semibold text-gray-900">現在のタスク</h2>
            <p className="mb-4 text-gray-700">{currentTask.text}</p>

            {/* 投票結果（公開後） */}
            {currentTask.isRevealed && (
              <div className="mb-4 rounded-lg bg-gray-50 p-4">
                <h3 className="mb-3 font-medium text-gray-900">投票結果</h3>
                <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
                  {participants.map((participant) => (
                    <div key={participant.id} className="text-center">
                      <div className="rounded-lg border bg-white p-3">
                        <p className="text-sm text-gray-600">{participant.nickname}</p>
                        <p className="text-2xl font-bold text-blue-600">{participant.vote || '-'}</p>
                        {participant.isFacilitator && (
                          <span className="text-xs text-blue-600">ファシリテーター</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                {average && (
                  <div className="text-center">
                    <p className="text-sm text-gray-600">平均ポイント</p>
                    <p className="text-3xl font-bold text-green-600">{average}</p>
                  </div>
                )}
              </div>
            )}

            {/* ファシリテーター用投票状況（非公開時） */}
            {isFacilitator && currentTask && !currentTask.isRevealed && (
              <div className="mb-4 rounded-lg bg-yellow-50 p-4">
                <h3 className="mb-3 font-medium text-gray-900">投票状況（ファシリテーター専用）</h3>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  {participants.map((participant) => (
                    <div key={participant.id} className="text-center">
                      <div className={`rounded-lg border p-3 ${participant.hasVoted ? 'border-green-300 bg-green-100' : 'border-gray-300 bg-gray-100'}`}>
                        <p className="text-sm text-gray-600">{participant.nickname}</p>
                        <p className="text-lg font-bold">
                          {participant.hasVoted ? (
                            <span className="text-green-600">✓ 投票済み</span>
                          ) : (
                            <span className="text-gray-500">待機中</span>
                          )}
                        </p>
                        {participant.isFacilitator && (
                          <span className="text-xs text-blue-600">ファシリテーター</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ファシリテーターコントロール */}
            {isFacilitator && (
              <div className="flex gap-3">
                {!currentTask.isRevealed && allVoted && (
                  <button
                    onClick={revealCards}
                    className="rounded-lg bg-green-600 px-6 py-2 font-medium text-white hover:bg-green-700"
                  >
                    カードを公開
                  </button>
                )}
                {currentTask.isRevealed && (
                  <button
                    onClick={nextTask}
                    className="rounded-lg bg-blue-600 px-6 py-2 font-medium text-white hover:bg-blue-700"
                  >
                    次のタスクへ
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* ポイントカード選択 */}
        {currentTask && !currentTask.isRevealed && (
          <div className="mb-6 rounded-lg bg-white p-4 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">ポイントを選択</h2>
            <div className="grid grid-cols-3 gap-3 md:grid-cols-5">
              {POINT_CARDS.map((card) => (
                <button
                  key={card}
                  onClick={() => sendVote(card)}
                  className={`rounded-lg border-2 p-4 text-lg font-bold transition-all ${selectedCard === card
                    ? 'border-blue-500 bg-blue-50 text-blue-600'
                    : 'border-gray-300 hover:border-blue-300 hover:bg-gray-50'
                    }`}
                >
                  {card}
                </button>
              ))}
            </div>
            {selectedCard && (
              <p className="mt-4 text-center text-sm text-gray-600">
                選択済み: <span className="font-semibold">{selectedCard}</span>
              </p>
            )}
          </div>
        )}

        {/* コメント入力 */}
        {/* <div className="rounded-lg bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-lg font-semibold text-gray-900">コメント</h2>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="コメントを入力してください（任意）"
            className="w-full resize-none rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-blue-500"
            rows={3}
          />
        </div> */}
      </div>
    </div>
  )
} 