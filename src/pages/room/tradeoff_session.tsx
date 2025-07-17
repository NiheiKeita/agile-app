import { useTradeoffRoomView } from '../../views/RoomView/hooks'
import { useCallback } from 'react'

export default function TradeoffSessionPage() {
  const {
    roomId,
    nickname,
    isFacilitator,
    participants,
    theme,
    sliderValue,
    locked,
    isConnecting,
    error,
    setTheme,
    setSliderValue,
    setLocked,
  } = useTradeoffRoomView()

  // ルームURL共有ボタンのハンドラ
  const handleShareUrl = useCallback(async () => {
    const url = typeof window !== 'undefined' ? window.location.href : ''
    try {
      await navigator.clipboard.writeText(url)
      alert('ルームURLをクリップボードにコピーしました！')
    } catch (err) {
      // フォールバック
      const textArea = document.createElement('textarea')
      textArea.value = url
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      alert('ルームURLをクリップボードにコピーしました！')
    }
  }, [])

  // テーマ送信ボタンのハンドラ（SkyWay同期）
  const handleSendTheme = useCallback(() => {
    setTheme(theme) // useTradeoffRoomViewのsetThemeはSkyWay同期も行う
  }, [setTheme, theme])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-pink-50 to-yellow-100 p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white p-8 shadow-xl">
        <h1 className="mb-4 text-2xl font-bold text-gray-900">トレードオフスライダー セッション</h1>
        <div className="mb-4 text-gray-700">
          <div>ルームID: <span className="font-mono">{roomId}</span></div>
          <div>ニックネーム: <span className="font-mono">{nickname}</span></div>
          <div>ファシリテーター: <span className="font-mono">{isFacilitator ? 'はい' : 'いいえ'}</span></div>
          {/* URL共有ボタン */}
          {roomId && (
            <button
              onClick={handleShareUrl}
              className="ml-2 mt-2 rounded bg-green-500 px-3 py-1 text-sm font-medium text-white hover:bg-green-600"
            >
              URL共有
            </button>
          )}
        </div>
        {error && (
          <div className="mb-4 rounded bg-red-100 p-2 text-red-700">{error}</div>
        )}
        {isConnecting && (
          <div className="mb-4 text-gray-500">SkyWay接続中...</div>
        )}
        {/* テーマ設定（ファシリテーターのみ） */}
        {isFacilitator && (
          <div className="mb-6 flex flex-col gap-2 rounded bg-pink-50 p-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={theme.leftLabel}
                onChange={e => setTheme({ ...theme, leftLabel: e.target.value })}
                className="flex-1 rounded border px-2 py-1"
                placeholder="左ラベル（例: スピード）"
              />
              <span className="self-center text-gray-500">vs</span>
              <input
                type="text"
                value={theme.rightLabel}
                onChange={e => setTheme({ ...theme, rightLabel: e.target.value })}
                className="flex-1 rounded border px-2 py-1"
                placeholder="右ラベル（例: クオリティ）"
              />
            </div>
            <div className="mt-2 flex gap-2">
              <button
                className="rounded bg-pink-600 px-4 py-2 text-white hover:bg-pink-700"
                onClick={handleSendTheme}
              >
                テーマを全員に送信
              </button>
              <button
                className={`rounded px-4 py-2 text-white ${locked ? 'bg-gray-400' : 'bg-yellow-500 hover:bg-yellow-600'}`}
                onClick={() => setLocked(!locked)}
              >
                {locked ? 'ロック解除' : 'スライドをロック'}
              </button>
            </div>
          </div>
        )}
        {/* テーマ表示 */}
        <div className="mb-6 flex items-center justify-center gap-4">
          <span className="text-lg font-semibold text-pink-700">{theme.leftLabel}</span>
          <input
            type="range"
            min={0}
            max={100}
            value={sliderValue}
            onChange={e => setSliderValue(Number(e.target.value))}
            disabled={locked}
            className="w-64 accent-pink-500"
          />
          <span className="text-lg font-semibold text-yellow-700">{theme.rightLabel}</span>
        </div>
        <div className="mb-8 text-center text-sm text-gray-500">
          {locked ? 'スライダーはロック中です' : 'スライダーを動かして自分の価値観を選択しましょう'}
        </div>
        {/* 参加者リスト（仮） */}
        <div className="mb-6">
          <h2 className="mb-2 text-lg font-semibold text-gray-900">参加者</h2>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            {participants.length === 0 ? (
              <div className="col-span-2 text-gray-400">（参加者情報は未実装）</div>
            ) : (
              participants.map(p => (
                <div key={p.id} className={`rounded border p-2 text-center ${p.nickname === nickname ? 'border-pink-400 bg-pink-50' : 'border-gray-200 bg-gray-50'}`}>
                  <div className="font-bold">{p.nickname}</div>
                  <div className="text-xs text-gray-500">{p.value}</div>
                  {p.isFacilitator && <div className="text-xs text-pink-600">ファシリテーター</div>}
                </div>
              ))
            )}
          </div>
        </div>
        {/* 集計グラフ（簡易棒グラフ） */}
        <div className="mb-4">
          <h2 className="mb-2 text-lg font-semibold text-gray-900">全体傾向グラフ</h2>
          <div className="rounded bg-gray-100 p-4 text-center">
            <div className="flex h-32 items-end justify-center gap-2">
              {participants.length === 0 ? (
                <div className="text-gray-400">（参加者がいません）</div>
              ) : (
                participants.map(p => (
                  <div key={p.id} className="flex flex-col items-center">
                    <div
                      className={`w-6 rounded-t ${p.nickname === nickname ? 'bg-pink-500' : 'bg-yellow-400'} transition-all`}
                      style={{ height: `${p.value * 1.2}px` }}
                      title={`${p.nickname}: ${p.value}`}
                    ></div>
                    <div className={`mt-1 text-xs ${p.nickname === nickname ? 'font-bold text-pink-600' : 'text-gray-600'}`}>{p.nickname}</div>
                    <div className="text-xs text-gray-500">{p.value}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 