'use client'

import { useState } from 'react'
import { VocabularyWord } from '@/types/database'

interface FlashcardProps {
  word: VocabularyWord
  targetLanguage: 'french' | 'korean'
  onRate: (score: number) => void
}

export default function Flashcard({ word, targetLanguage, onRate }: FlashcardProps) {
  const [isFlipped, setIsFlipped] = useState(false)
  const [showRating, setShowRating] = useState(false)

  const translation = targetLanguage === 'french' 
    ? word.french_translation 
    : word.korean_translation

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

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Flashcard */}
      <div 
        className={`bg-white rounded-3xl shadow-2xl p-12 mb-8 cursor-pointer transition-all duration-300 hover:shadow-3xl min-h-[300px] flex items-center justify-center ${
          isFlipped ? 'bg-gradient-to-br from-purple-50 to-pink-50' : ''
        }`}
        onClick={!isFlipped ? handleFlip : undefined}
      >
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