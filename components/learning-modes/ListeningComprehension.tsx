// components/learning-modes/ListeningComprehension.tsx
// Audio-first learning mode: Hear word → Select English meaning

'use client'

import { useState, useEffect } from 'react'
import { speakWord } from '@/lib/speech'
import SpeakerButton from '@/components/SpeakerButton'

interface ListeningComprehensionProps {
  word: string
  correctTranslation: string
  incorrectOptions: string[] // Should be 3 other English words
  language: 'french' | 'korean'
  onComplete: (quality: number) => void
}

export default function ListeningComprehension({
  word,
  correctTranslation,
  incorrectOptions,
  language,
  onComplete
}: ListeningComprehensionProps) {
  const [options, setOptions] = useState<string[]>([])
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const [attempts, setAttempts] = useState(0)
  const [showWord, setShowWord] = useState(false)

  // Reset state and shuffle options when word changes
  useEffect(() => {
    // Reset all state for new word
    setSelectedAnswer(null)
    setIsCorrect(null)
    setAttempts(0)
    setShowWord(false)
    
    // Shuffle options
    const allOptions = [correctTranslation, ...incorrectOptions]
    setOptions(shuffleArray(allOptions))
    
    // Auto-play the word when component loads
    setTimeout(() => {
      speakWord(word, language)
    }, 500)
  }, [word, correctTranslation, incorrectOptions, language])

  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }

  const handleSelectAnswer = (answer: string) => {
    if (isCorrect !== null) return // Already answered

    setSelectedAnswer(answer)
    setAttempts(attempts + 1)
    const correct = answer === correctTranslation

    setIsCorrect(correct)

    if (correct) {
      // Calculate quality based on attempts
      const quality = attempts === 0 ? 5 : attempts === 1 ? 4 : 3
      
      setTimeout(() => {
        onComplete(quality)
      }, 1500)
    } else {
      // Wrong answer - let them try again
      setTimeout(() => {
        setSelectedAnswer(null)
        setIsCorrect(null)
      }, 1000)
    }
  }

  const handleRevealWord = () => {
    setShowWord(true)
  }

  const getButtonStyle = (option: string) => {
    if (selectedAnswer === option) {
      return isCorrect
        ? 'bg-green-500 text-white border-green-600'
        : 'bg-red-500 text-white border-red-600'
    }
    return 'bg-white hover:bg-blue-50 border-gray-300 text-gray-800'
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] p-6">
      {/* Audio Player */}
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center gap-4 mb-4">
          <SpeakerButton
            text={word}
            language={language}
            size="lg"
            variant="primary"
          />
          <div className="text-gray-600">
            <p className="text-lg font-medium">Listen carefully</p>
            <p className="text-sm">Tap to replay</p>
          </div>
        </div>

        {/* Show word option */}
        {!showWord && (
          <button
            onClick={handleRevealWord}
            className="text-sm text-blue-600 hover:text-blue-700 underline mt-2"
          >
            Show word ({language === 'french' ? 'FR' : 'KR'})
          </button>
        )}

        {showWord && (
          <div className="mt-4 text-3xl font-bold text-gray-800">
            {word}
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="mb-6 text-center">
        <h2 className="text-xl font-semibold text-gray-800 mb-2">
          What does this word mean?
        </h2>
        <p className="text-sm text-gray-600">
          {attempts > 0 && `Attempt ${attempts + 1}`}
        </p>
      </div>

      {/* Answer Options */}
      <div className="grid grid-cols-1 gap-3 w-full max-w-md">
        {options.map((option, index) => (
          <button
            key={index}
            onClick={() => handleSelectAnswer(option)}
            disabled={isCorrect !== null}
            className={`
              ${getButtonStyle(option)}
              px-6 py-4 
              rounded-lg 
              border-2
              text-lg font-medium
              transition-all duration-200
              active:scale-98
              disabled:cursor-not-allowed
              shadow-sm hover:shadow-md
            `}
          >
            {option}
          </button>
        ))}
      </div>

      {/* Feedback */}
      {isCorrect !== null && (
        <div className={`
          mt-6 p-4 rounded-lg text-center
          ${isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
        `}>
          {isCorrect ? (
            <div>
              <p className="font-semibold text-lg">✓ Correct!</p>
              <p className="text-sm mt-1">
                {word} = {correctTranslation}
              </p>
            </div>
          ) : (
            <div>
              <p className="font-semibold">✗ Not quite</p>
              <p className="text-sm mt-1">Try again!</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}