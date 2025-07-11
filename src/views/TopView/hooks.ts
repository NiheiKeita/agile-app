import { useState } from 'react'
import { useRouter } from 'next/router'

export interface RoomFormData {
  roomId: string
  nickname: string
}

export const useTopView = () => {
  const router = useRouter()
  const [formData, setFormData] = useState<RoomFormData>({
    roomId: '',
    nickname: '',
  })

  const generateRoomId = (): string => {
    // 8文字のランダムなIDを生成
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let result = ''
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }

    return result
  }

  const handleCreateRoom = () => {
    const roomId = generateRoomId()
    const nickname = formData.nickname || 'ファシリテーター'

    // ルーム作成ページに遷移
    router.push(`/room/${roomId}?nickname=${encodeURIComponent(nickname)}&isFacilitator=true`)
  }

  const handleJoinRoom = () => {
    if (!formData.roomId.trim() || !formData.nickname.trim()) {
      return
    }

    // ルーム参加ページに遷移
    router.push(`/room/${formData.roomId}?nickname=${encodeURIComponent(formData.nickname)}&isFacilitator=false`)
  }

  const updateFormData = (field: keyof RoomFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }))
  }

  const canJoinRoom = formData.roomId.trim() !== '' && formData.nickname.trim() !== ''

  return {
    formData,
    updateFormData,
    handleCreateRoom,
    handleJoinRoom,
    canJoinRoom,
  }
} 