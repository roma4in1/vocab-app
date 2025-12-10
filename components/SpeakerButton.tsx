// components/SpeakerButton.tsx
// Reusable Text-to-Speech button component

'use client'

import { useState, useEffect } from 'react'
import { speakWord, stopSpeaking, isTTSSupported } from '@/lib/speech'

interface SpeakerButtonProps {
  text: string
  language: 'french' | 'korean'
  autoPlay?: boolean
  size?: 'sm' | 'md' | 'lg'
  variant?: 'primary' | 'ghost' | 'minimal'
  className?: string
}

export default function SpeakerButton({
  text,
  language,
  autoPlay = false,
  size = 'md',
  variant = 'primary',
  className = ''
}: SpeakerButtonProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isSupported, setIsSupported] = useState(true)

  // Check TTS support on mount
  useEffect(() => {
    setIsSupported(isTTSSupported())
  }, [])

  // Auto-play if enabled
  useEffect(() => {
    if (autoPlay && isSupported && text) {
      handleSpeak()
    }
  }, [text, autoPlay, isSupported])

  const handleSpeak = () => {
    if (!isSupported || !text) return

    setIsPlaying(true)
    speakWord(text, language)

    // Reset playing state after ~2 seconds (approximate speech duration)
    const duration = Math.min(text.length * 100, 3000)
    setTimeout(() => setIsPlaying(false), duration)
  }

  const handleStop = () => {
    stopSpeaking()
    setIsPlaying(false)
  }

  if (!isSupported) {
    return null // Don't show button if TTS not supported
  }

  // Size classes
  const sizeClasses = {
    sm: 'w-8 h-8 text-lg',
    md: 'w-10 h-10 text-xl',
    lg: 'w-12 h-12 text-2xl'
  }

  // Variant classes
  const variantClasses = {
    primary: 'bg-blue-500 hover:bg-blue-600 text-white shadow-md',
    ghost: 'bg-gray-100 hover:bg-gray-200 text-gray-700',
    minimal: 'bg-transparent hover:bg-gray-100 text-gray-600'
  }

  return (
    <button
      onClick={isPlaying ? handleStop : handleSpeak}
      className={`
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        rounded-full 
        flex items-center justify-center
        transition-all duration-200
        active:scale-95
        focus:outline-none focus:ring-2 focus:ring-blue-400
        ${isPlaying ? 'animate-pulse' : ''}
        ${className}
      `}
      aria-label={isPlaying ? 'Stop speaking' : 'Speak word'}
      type="button"
    >
      {isPlaying ? (
        // Stop icon
        <svg className="w-1/2 h-1/2" fill="currentColor" viewBox="0 0 24 24">
          <rect x="6" y="6" width="12" height="12" rx="2" />
        </svg>
      ) : (
        // Speaker icon
        <svg className="w-1/2 h-1/2" fill="currentColor" viewBox="0 0 24 24">
          <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
        </svg>
      )}
    </button>
  )
}