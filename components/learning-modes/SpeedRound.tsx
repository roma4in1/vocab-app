// components/learning-modes/SpeedRound.tsx
// Speed Round: Rapid-fire vocabulary practice with timer

'use client'

import { useState, useEffect, useCallback } from 'react'
import SpeakerButton from '@/components/SpeakerButton'

interface Word {
  id: string
  word: string
  translation: string
}

interface SpeedRoundProps {
  words: Word[] // Should be 5-10 words
  language: 'french' | 'korean'
  timePerWord: number // Seconds per word (default: 30)
  onComplete: (results: { wordId: string; quality: number }[]) => void
}

export default function SpeedRound({
  words,
  language,
  timePerWord = 30,
  onComplete
}: SpeedRoundProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [timeLeft, setTimeLeft] = useState(timePerWord)
  const [results, setResults] = useState<{ wordId: string; quality: number }[]>([])
  const [userAnswer, setUserAnswer] = useState('')
  const [isFinished, setIsFinished] = useState(false)
  const [showAnswer, setShowAnswer] = useState(false)

  const currentWord = words[currentIndex]
  const totalWords = words.length
  const progress = ((currentIndex + 1) / totalWords) * 100

  // Timer countdown
  useEffect(() => {
    if (isFinished || showAnswer) return

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Time's up - automatically skip
          handleSkip()
          return timePerWord
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [currentIndex, isFinished, showAnswer, timePerWord])

  const handleSkip = useCallback(() => {
    // Record as failed attempt
    setResults([...results, { wordId: currentWord.id, quality: 0 }])
    
    if (currentIndex + 1 >= totalWords) {
      finishRound([...results, { wordId: currentWord.id, quality: 0 }])
    } else {
      moveToNext()
    }
  }, [currentIndex, currentWord, results, totalWords])

  const handleSubmit = () => {
    setShowAnswer(true)
  }

  const handleRate = (quality: number) => {
    const newResults = [...results, { wordId: currentWord.id, quality }]
    setResults(newResults)

    if (currentIndex + 1 >= totalWords) {
      finishRound(newResults)
    } else {
      moveToNext()
    }
  }

  const moveToNext = () => {
    setCurrentIndex(currentIndex + 1)
    setUserAnswer('')
    setShowAnswer(false)
    setTimeLeft(timePerWord)
  }

  const finishRound = (finalResults: { wordId: string; quality: number }[]) => {
    setIsFinished(true)
    setTimeout(() => {
      onComplete(finalResults)
    }, 2000)
  }

  const calculateScore = () => {
    const total = results.reduce((sum, r) => sum + r.quality, 0)
    const max = results.length * 5
    return Math.round((total / max) * 100)
  }

  if (isFinished) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] p-6 text-center">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Speed Round Complete!
        </h2>
        <div className="text-5xl font-bold text-blue-600 my-4">
          {calculateScore()}%
        </div>
        <p className="text-gray-600">
          You completed {results.length} words
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-[500px] p-6">
      {/* Header with progress and timer */}
      <div className="flex justify-between items-center mb-6">
        <div className="text-sm text-gray-600">
          Word {currentIndex + 1} of {totalWords}
        </div>
        <div className={`
          text-2xl font-bold
          ${timeLeft <= 5 ? 'text-red-600 animate-pulse' : 'text-gray-800'}
        `}>
          {timeLeft}s
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full h-2 bg-gray-200 rounded-full mb-8 overflow-hidden">
        <div
          className="h-full bg-blue-500 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Word display */}
      <div className="flex items-center justify-center gap-4 mb-6">
        <SpeakerButton
          text={currentWord.word}
          language={language}
          size="lg"
          autoPlay={true}
        />
        <div className="text-4xl font-bold text-gray-800">
          {currentWord.word}
        </div>
      </div>

      {!showAnswer ? (
        // Input phase
        <div className="flex-1 flex flex-col items-center justify-center">
          <input
            type="text"
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder="Type English translation..."
            className="w-full max-w-md px-6 py-4 text-xl text-center border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
            autoFocus
          />

          <div className="flex gap-3 mt-6">
            <button
              onClick={handleSkip}
              className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium transition-colors"
            >
              Skip
            </button>
            <button
              onClick={handleSubmit}
              disabled={!userAnswer.trim()}
              className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Check Answer
            </button>
          </div>
        </div>
      ) : (
        // Rating phase
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="mb-6 text-center">
            <p className="text-gray-600 mb-2">Your answer:</p>
            <p className="text-2xl font-semibold text-gray-800 mb-4">
              {userAnswer || "(skipped)"}
            </p>
            <p className="text-gray-600 mb-2">Correct answer:</p>
            <p className="text-2xl font-semibold text-green-600">
              {currentWord.translation}
            </p>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600 mb-3">How well did you know it?</p>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  onClick={() => handleRate(rating)}
                  className={`
                    w-12 h-12 rounded-lg font-bold text-lg
                    ${rating <= 2 ? 'bg-red-500 hover:bg-red-600' : 
                      rating === 3 ? 'bg-yellow-500 hover:bg-yellow-600' : 
                      'bg-green-500 hover:bg-green-600'}
                    text-white transition-colors
                  `}
                >
                  {rating}
                </button>
              ))}
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-2 max-w-[240px]">
              <span>Hard</span>
              <span>Easy</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}