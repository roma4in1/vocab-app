// components/learning-modes/SentenceBuilder.tsx
// Sentence Builder: Use vocabulary word in a complete sentence

'use client'

import { useState, useEffect } from 'react'
import SpeakerButton from '@/components/SpeakerButton'

interface SentenceBuilderProps {
  word: string
  translation: string
  language: 'french' | 'korean'
  exampleSentence?: string // Optional example for hints
  onComplete: (quality: number) => void
}

export default function SentenceBuilder({
  word,
  translation,
  language,
  exampleSentence,
  onComplete
}: SentenceBuilderProps) {
  const [userSentence, setUserSentence] = useState('')
  const [showHint, setShowHint] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [wordCount, setWordCount] = useState(0)

  // Reset state when word changes
  useEffect(() => {
    setUserSentence('')
    setShowHint(false)
    setSubmitted(false)
    setWordCount(0)
  }, [word, translation])

  useEffect(() => {
    const words = userSentence.trim().split(/\s+/).filter(w => w.length > 0)
    setWordCount(words.length)
  }, [userSentence])

  const containsTargetWord = () => {
    const sentence = userSentence.toLowerCase()
    const target = word.toLowerCase()
    return sentence.includes(target)
  }

  const isValidSentence = () => {
    // Basic validation: at least 4 words, contains target word, ends with punctuation
    const endsWithPunctuation = /[.!?]$/.test(userSentence.trim())
    return wordCount >= 4 && containsTargetWord() && endsWithPunctuation
  }

  const handleSubmit = () => {
    if (!isValidSentence()) return

    setSubmitted(true)
  }

  const handleRate = (quality: number) => {
    onComplete(quality)
  }

  const handleSkip = () => {
    onComplete(0)
  }

  return (
    <div className="flex flex-col min-h-[500px] p-6">
      {/* Word Display */}
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center gap-4 mb-4">
          <SpeakerButton
            text={word}
            language={language}
            size="md"
          />
          <div>
            <div className="text-3xl font-bold text-gray-800">
              {word}
            </div>
            <div className="text-lg text-gray-600 mt-1">
              {translation}
            </div>
          </div>
        </div>

        <div className="text-sm text-gray-500 mt-4">
          {language === 'french' ? '🇫🇷 French' : '🇰🇷 Korean'}
        </div>
      </div>

      {!submitted ? (
        // Input Phase
        <>
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-2 text-center">
              Write a sentence using this word
            </h2>
            <p className="text-sm text-gray-600 text-center">
              Use "{word}" in a sentence in {language === 'french' ? 'French' : 'Korean'}
            </p>
          </div>

          <div className="flex-1 flex flex-col">
            <textarea
              value={userSentence}
              onChange={(e) => setUserSentence(e.target.value)}
              placeholder={`Example: ${exampleSentence || `J'aime le ${word}...`}`}
              className="w-full h-40 px-4 py-3 border-2 border-gray-300 rounded-lg resize-none focus:border-blue-500 focus:outline-none text-lg"
              autoFocus
            />

            {/* Validation Hints */}
            <div className="mt-3 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <span className={wordCount >= 4 ? 'text-green-600' : 'text-gray-400'}>
                  {wordCount >= 4 ? '✓' : '○'}
                </span>
                <span className={wordCount >= 4 ? 'text-gray-700' : 'text-gray-500'}>
                  At least 4 words ({wordCount})
                </span>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <span className={containsTargetWord() ? 'text-green-600' : 'text-gray-400'}>
                  {containsTargetWord() ? '✓' : '○'}
                </span>
                <span className={containsTargetWord() ? 'text-gray-700' : 'text-gray-500'}>
                  Contains "{word}"
                </span>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <span className={/[.!?]$/.test(userSentence.trim()) ? 'text-green-600' : 'text-gray-400'}>
                  {/[.!?]$/.test(userSentence.trim()) ? '✓' : '○'}
                </span>
                <span className={/[.!?]$/.test(userSentence.trim()) ? 'text-gray-700' : 'text-gray-500'}>
                  Ends with punctuation (. ! ?)
                </span>
              </div>
            </div>

            {/* Hint Button */}
            {exampleSentence && !showHint && (
              <button
                onClick={() => setShowHint(true)}
                className="mt-4 text-sm text-blue-600 hover:text-blue-700 underline"
              >
                Show example sentence
              </button>
            )}

            {showHint && exampleSentence && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Example:</p>
                <p className="text-base text-gray-800">{exampleSentence}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSkip}
                className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium transition-colors"
              >
                Skip
              </button>
              <button
                onClick={handleSubmit}
                disabled={!isValidSentence()}
                className="flex-1 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Submit
              </button>
            </div>
          </div>
        </>
      ) : (
        // Rating Phase
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="mb-8 text-center max-w-2xl">
            <p className="text-gray-600 mb-3">Your sentence:</p>
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <p className="text-xl text-gray-800">
                {userSentence}
              </p>
            </div>
          </div>

          <div className="text-center">
            <p className="text-lg font-medium text-gray-800 mb-4">
              How confident are you in this sentence?
            </p>
            <div className="flex gap-2 justify-center">
              {[
                { rating: 1, label: 'Unsure', color: 'red' },
                { rating: 2, label: 'Shaky', color: 'orange' },
                { rating: 3, label: 'OK', color: 'yellow' },
                { rating: 4, label: 'Good', color: 'lime' },
                { rating: 5, label: 'Perfect', color: 'green' }
              ].map(({ rating, label, color }) => (
                <button
                  key={rating}
                  onClick={() => handleRate(rating)}
                  className={`
                    px-4 py-3 rounded-lg font-medium
                    transition-all hover:scale-105
                    ${color === 'red' ? 'bg-red-500 hover:bg-red-600' :
                      color === 'orange' ? 'bg-orange-500 hover:bg-orange-600' :
                      color === 'yellow' ? 'bg-yellow-500 hover:bg-yellow-600' :
                      color === 'lime' ? 'bg-lime-500 hover:bg-lime-600' :
                      'bg-green-500 hover:bg-green-600'}
                    text-white
                  `}
                >
                  <div className="text-2xl font-bold">{rating}</div>
                  <div className="text-xs mt-1">{label}</div>
                </button>
              ))}
            </div>
          </div>

          {exampleSentence && (
            <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg max-w-2xl">
              <p className="text-sm text-gray-600 mb-2">Reference example:</p>
              <p className="text-base text-gray-800">{exampleSentence}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}