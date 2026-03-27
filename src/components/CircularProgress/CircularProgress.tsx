'use client'

import { useState, useEffect, useRef } from 'react'
import styles from './CircularProgress.module.css'

interface CircularProgressProps {
  loading: boolean
  size?: number
  strokeWidth?: number
  centered?: boolean
  className?: string
}

export function CircularProgress({
  loading,
  size = 64,
  strokeWidth = 4,
  centered = true,
  className = '',
}: CircularProgressProps) {
  const [progress, setProgress] = useState(0)
  const rafRef = useRef<number>(0)
  const startRef = useRef<number>(0)

  useEffect(() => {
    if (loading) {
      setProgress(0)
      startRef.current = 0
      const duration = 2500
      const targetProgress = 90

      const animate = (timestamp: number) => {
        if (!startRef.current) startRef.current = timestamp
        const elapsed = timestamp - startRef.current
        const t = Math.min(elapsed / duration, 1)
        const eased = 1 - Math.pow(1 - t, 3)
        setProgress(eased * targetProgress)
        if (t < 1) {
          rafRef.current = requestAnimationFrame(animate)
        }
      }

      rafRef.current = requestAnimationFrame(animate)
      return () => cancelAnimationFrame(rafRef.current)
    } else {
      startRef.current = 0
      setProgress(100)
    }
  }, [loading])

  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - progress / 100)
  const textPx = Math.round(Math.max(12, Math.min(32, size * 0.22)))

  const content = (
    <div
      className={`${styles.progress} ${className}`}
      role="progressbar"
      aria-valuenow={Math.round(progress)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={loading ? 'Loading' : 'Complete'}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          opacity={0.15}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{
            transition: progress === 100 ? 'stroke-dashoffset 0.3s ease-out' : 'stroke-dashoffset 0.08s linear',
          }}
        />
      </svg>
      <span className={styles.text} style={{ fontSize: textPx }}>
        {Math.round(progress)}%
      </span>
    </div>
  )

  if (centered) {
    return (
      <div className={styles.wrap}>
        {content}
      </div>
    )
  }
  return content
}
