// XServer用設定ファイル
module.exports = {
  // 本番環境のポート設定
  port: process.env.PORT || 3000,

  // 本番環境のホスト設定
  hostname: process.env.HOSTNAME || '0.0.0.0',

  // 環境変数
  env: {
    NODE_ENV: 'production'
  },

  // 起動コマンド
  start: 'npm start',

  // デプロイ後の実行コマンド
  postDeploy: [
    'chmod +x deploy.sh',
    './deploy.sh'
  ]
} 