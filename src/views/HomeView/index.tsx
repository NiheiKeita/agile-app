import { useRouter } from 'next/router'

export function HomeView() {
  const router = useRouter()

  const handleStartPlanningPoker = () => {
    router.push('/planning_poker')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* ヘッダー */}
      <header className="border-b bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">アジャイル開発ツール</h1>
            </div>
            <nav className="hidden space-x-8 md:flex">
              <a href="#features" className="text-gray-600 hover:text-gray-900">機能</a>
              <a href="#about" className="text-gray-600 hover:text-gray-900">概要</a>
            </nav>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main>
        {/* ヒーローセクション */}
        <section className="px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="mb-6 text-4xl font-bold text-gray-900 md:text-6xl">
              アジャイル開発を
              <span className="text-blue-600">効率的に</span>
            </h2>
            <p className="mx-auto mb-8 max-w-2xl text-xl text-gray-600">
              プランニングポーカーをはじめとするアジャイル開発ツールで、
              チームの生産性を向上させましょう。
            </p>
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <button
                onClick={handleStartPlanningPoker}
                className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-8 py-3 font-semibold text-white transition-colors duration-200 hover:bg-blue-700"
              >
                <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                プランニングポーカーを始める
              </button>
              <button className="rounded-lg bg-gray-100 px-8 py-3 font-semibold text-gray-700 transition-colors duration-200 hover:bg-gray-200">
                詳細を見る
              </button>
            </div>
          </div>
        </section>

        {/* 機能セクション */}
        <section id="features" className="bg-white py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-16 text-center">
              <h3 className="mb-4 text-3xl font-bold text-gray-900">主な機能</h3>
              <p className="text-lg text-gray-600">アジャイル開発に必要な機能を提供します</p>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
              {/* プランニングポーカー */}
              <div className="rounded-lg bg-blue-50 p-6 text-center">
                <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-blue-600">
                  <svg className="size-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h4 className="mb-2 text-xl font-semibold text-gray-900">プランニングポーカー</h4>
                <p className="mb-4 text-gray-600">
                  リアルタイム同期でチーム全体のストーリーポイント見積もりを効率的に行えます
                </p>
                <button
                  onClick={handleStartPlanningPoker}
                  className="font-medium text-blue-600 hover:text-blue-700"
                >
                  詳細を見る →
                </button>
              </div>

              {/* リアルタイム同期 */}
              <div className="rounded-lg bg-green-50 p-6 text-center">
                <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-green-600">
                  <svg className="size-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h4 className="mb-2 text-xl font-semibold text-gray-900">リアルタイム同期</h4>
                <p className="mb-4 text-gray-600">
                  SkyWayを使用したP2P通信で、バックエンドサーバーなしでリアルタイム同期を実現
                </p>
              </div>

              {/* モバイル対応 */}
              <div className="rounded-lg bg-purple-50 p-6 text-center">
                <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-purple-600">
                  <svg className="size-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <h4 className="mb-2 text-xl font-semibold text-gray-900">モバイル対応</h4>
                <p className="mb-4 text-gray-600">
                  レスポンシブデザインで、PC・タブレット・スマートフォンすべてで快適に使用可能
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 概要セクション */}
        <section id="about" className="py-20">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <div className="mb-12 text-center">
              <h3 className="mb-4 text-3xl font-bold text-gray-900">アプリケーション概要</h3>
              <p className="text-lg text-gray-600">
                アジャイル開発チームのための効率的なツールを提供します
              </p>
            </div>

            <div className="rounded-lg bg-white p-8 shadow-lg">
              <div className="grid gap-8 md:grid-cols-2">
                <div>
                  <h4 className="mb-4 text-xl font-semibold text-gray-900">技術スタック</h4>
                  <ul className="space-y-2 text-gray-600">
                    <li>• React + TypeScript</li>
                    <li>• Next.js</li>
                    <li>• Tailwind CSS</li>
                    <li>• SkyWay（P2P通信）</li>

                  </ul>
                </div>
                <div>
                  <h4 className="mb-4 text-xl font-semibold text-gray-900">特徴</h4>
                  <ul className="space-y-2 text-gray-600">
                    <li>• リアルタイム同期</li>
                    <li>• モバイルファーストデザイン</li>
                    <li>• 簡単セットアップ</li>
                    <li>• 無料で利用可能</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* フッター */}
      <footer className="bg-gray-900 py-12 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="mb-4 text-xl font-semibold">アジャイル開発ツール</h3>
            <p className="mb-6 text-gray-400">
              チームの生産性向上をサポートするツールを提供しています
            </p>
            <div className="flex justify-center space-x-6">
              <button
                onClick={handleStartPlanningPoker}
                className="text-blue-400 hover:text-blue-300"
              >
                プランニングポーカー
              </button>
              <a href="#features" className="text-gray-400 hover:text-gray-300">
                機能
              </a>
              <a href="#about" className="text-gray-400 hover:text-gray-300">
                概要
              </a>
            </div>
            <div className="mt-8 border-t border-gray-800 pt-8">
              <p className="text-sm text-gray-400">
                © 2024 アジャイル開発ツール. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
} 
