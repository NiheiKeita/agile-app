// プランニングポーカー用の型定義
export interface PokerParticipant {
  id: string
  nickname: string
  isFacilitator: boolean
  vote?: string
  hasVoted?: boolean
  disabled?: boolean
}

export interface PokerTask {
  text: string
  isRevealed: boolean
}

export const POINT_CARDS = ['0', '1', '2', '3', '5', '8', '13', '21', '?', '☕']

export const useRoomView = () => {
  // ここにプランニングポーカー用のロジックを記述（SkyWay接続、参加者管理、投票同期など）
  // ...
  return {
    // ここに必要な値や関数を返す
  }
} 