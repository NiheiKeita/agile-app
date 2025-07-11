import { useRouter } from 'next/router'
import { RoomView } from '../../views/RoomView'

export default function RoomPage() {
  const router = useRouter()
  const { roomId } = router.query

  // ルームIDが読み込まれるまでローディング表示
  if (!roomId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="mx-auto mb-4 size-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    )
  }

  return <RoomView />
} 