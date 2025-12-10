'use client'

import { useState } from 'react'
import { VocabularyWord } from '@/types/database'
import { speakWord, isTTSSupported } from '@/lib/speech'

interface FlashcardProps {
  word: VocabularyWord
  targetLanguage: 'french' | 'korean'
  onRate: (score: number) => void
}

export default function Flashcard({ word, targetLanguage, onRate }: FlashcardProps) {
  const [isFlipped, setIsFlipped] = useState(false)
  const [showRating, setShowRating] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)

  const translation = targetLanguage === 'french' 
    ? word.french_translation 
    : word.korean_translation

  const ttsSupported = isTTSSupported()

  function handleFlip() {
    setIsFlipped(true)
    setShowRating(true)
  }

  function handleRate(score: number) {
    onRate(score)
    // Reset for next card
    setIsFlipped(false)
    setShowRating(false)
  }

  function handleSpeak(e: React.MouseEvent) {
    e.stopPropagation() // Prevent card flip when clicking speaker
    if (!ttsSupported) {
      alert('Text-to-speech not supported on this device')
      return
    }
    
    setIsSpeaking(true)
    speakWord(translation, targetLanguage)
    
    // Reset speaking state after a delay
    setTimeout(() => setIsSpeaking(false), 1500)
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Flashcard */}
      <div 
        className={`bg-white rounded-3xl shadow-2xl p-12 mb-8 cursor-pointer transition-all duration-300 hover:shadow-3xl min-h-[300px] flex items-center justify-center relative ${
          isFlipped ? 'bg-gradient-to-br from-purple-50 to-pink-50' : ''
        }`}
        onClick={!isFlipped ? handleFlip : undefined}
      >
        {/* Speaker Icon - Only show when flipped */}
        {isFlipped && ttsSupported && (
          <button
            onClick={handleSpeak}
            className={`absolute top-6 right-6 p-4 rounded-full transition-all ${
              isSpeaking 
                ? 'bg-purple-600 text-white scale-110' 
                : 'bg-purple-100 text-purple-600 hover:bg-purple-200'
            }`}
            aria-label="Speak word"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24" 
              strokeWidth={2} 
              stroke="currentColor" 
              className="w-6 h-6"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" 
              />
            </svg>
          </button>
        )}

        <div className="text-center">
          {!isFlipped ? (
            <>
              <div className="text-6xl font-bold text-gray-800 mb-4">
                {word.english_word}
              </div>
              <p className="text-gray-500 text-lg">
                Tap to reveal translation
              </p>
            </>
          ) : (
            <>
              <div className="text-2xl text-gray-600 mb-4">
                {word.english_word}
              </div>
              <div className="text-6xl font-bold text-purple-600">
                {translation}
              </div>
              {ttsSupported && (
                <p className="text-purple-400 text-sm mt-4">
                  👆 Tap speaker to hear pronunciation
                </p>
              )}
            </>
          )}
        </div>
      </div>

      {/* Rating Buttons */}
      {showRating && (
        <div className="animate-fade-in">
          <p className="text-center text-gray-700 font-medium mb-4">
            How well did you know this word?
          </p>
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => handleRate(1)}
              className="bg-red-100 hover:bg-red-200 text-red-700 py-4 px-6 rounded-xl font-medium transition"
            >
              😓 Hard
            </button>
            <button
              onClick={() => handleRate(3)}
              className="bg-yellow-100 hover:bg-yellow-200 text-yellow-700 py-4 px-6 rounded-xl font-medium transition"
            >
              🤔 Okay
            </button>
            <button
              onClick={() => handleRate(5)}
              className="bg-green-100 hover:bg-green-200 text-green-700 py-4 px-6 rounded-xl font-medium transition"
            >
              😊 Easy
            </button>
          </div>
          
          {/* More detailed rating option */}
          <details className="mt-4">
            <summary className="text-center text-sm text-gray-500 cursor-pointer hover:text-gray-700">
              More options
            </summary>
            <div className="grid grid-cols-6 gap-2 mt-3">
              {[0, 1, 2, 3, 4, 5].map(score => (
                <button
                  key={score}
                  onClick={() => handleRate(score)}
                  className="bg-gray-100 hover:bg-gray-200 py-2 rounded-lg text-sm transition"
                >
                  {score}
                </button>
              ))}
            </div>
          </details>
        </div>
      )}
    </div>
  )
}