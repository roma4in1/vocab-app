// components/learning-modes/MultipleChoice.tsx
// Multiple choice with audio support

'use client'

import { useState, useEffect } from 'react'
import SpeakerButton from '@/components/SpeakerButton'

interface MultipleChoiceProps {
  word: string
  correctTranslation: string
  incorrectOptions: string[] // Should be 3 other options
  language: 'french' | 'korean'
  questionType: 'toEnglish' | 'fromEnglish' // Which direction?
  onComplete: (quality: number) => void
}

export default function MultipleChoice({
  word,
  correctTranslation,
  incorrectOptions,
  language,
  questionType = 'toEnglish',
  onComplete
}: MultipleChoiceProps) {
  const [options, setOptions] = useState<string[]>([])
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const [attempts, setAttempts] = useState(0)

  // Determine what to show based on question type
  const question = questionType === 'toEnglish' ? word : correctTranslation
  const answer = questionType === 'toEnglish' ? correctTranslation : word
  const showSpeaker = questionType === 'toEnglish' // Only show speaker for foreign word

  // Shuffle options and reset state when word/question changes
  useEffect(() => {
    // Reset state for new word
    setSelectedAnswer(null)
    setIsCorrect(null)
    setAttempts(0)
    
    // Shuffle options
    const allOptions = [answer, ...incorrectOptions]
    setOptions(shuffleArray(allOptions))
  }, [word, correctTranslation, answer, incorrectOptions])

  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }

  const handleSelectAnswer = (option: string) => {
    if (isCorrect !== null) return // Already answered

    setSelectedAnswer(option)
    setAttempts(attempts + 1)
    const correct = option === answer

    setIsCorrect(correct)

    if (correct) {
      // Calculate quality: first try = 5, second = 4, third+ = 3
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

  const getButtonStyle = (option: string) => {
    if (selectedAnswer === option) {
      return isCorrect
        ? 'bg-green-500 text-white border-green-600 shadow-lg'
        : 'bg-red-500 text-white border-red-600 shadow-lg'
    }
    return 'bg-white hover:bg-blue-50 border-gray-300 text-gray-800 hover:shadow-md'
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] p-6">
      {/* Question Display */}
      <div className="mb-8 text-center">
        <p className="text-sm text-gray-600 mb-4">
          {questionType === 'toEnglish' 
            ? `What does this ${language === 'french' ? 'French' : 'Korean'} word mean?`
            : `How do you say this in ${language === 'french' ? 'French' : 'Korean'}?`
          }
        </p>

        <div className="flex items-center justify-center gap-4">
          {showSpeaker && (
            <SpeakerButton
              text={question}
              language={language}
              size="lg"
              autoPlay={true}
            />
          )}
          <div className="text-4xl font-bold text-gray-800">
            {question}
          </div>
        </div>

        {attempts > 0 && (
          <p className="text-sm text-gray-500 mt-3">
            Attempt {attempts + 1}
          </p>
        )}
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
              <p className="font-semibold">✗ Try again!</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}