import React from 'react'

interface FlipCardProps {
  isFlipped: boolean
  front: React.ReactNode
  back: React.ReactNode
  width?: string | number
  height?: string | number
  className?: string
}

export const FlipCard: React.FC<FlipCardProps> = ({ isFlipped, front, back, width = 100, height = 140, className }) => {
  return (
    <div className={`flip-card ${className ?? ''}`} style={{ width, height }}>
      <div className={`flip-card-inner${isFlipped ? ' flipped' : ''}`}>
        <div className="flip-card-back" style={{ width: '100%', height: '100%' }}>
          {back}
        </div>
        <div className="flip-card-front" style={{ width: '100%', height: '100%' }}>
          {front}
        </div>
      </div>
    </div>
  )
} 