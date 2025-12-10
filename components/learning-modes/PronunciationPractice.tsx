// components/learning-modes/PronunciationPractice.tsx
// 🎤 Pronunciation Practice Mode - Speech Recognition

'use client'

import { useState, useEffect } from 'react'
import { speakWord, isSpeechRecognitionSupported } from '@/lib/speech'
import SpeakerButton from '@/components/SpeakerButton'

interface PronunciationPracticeProps {
  word: string
  translation: string
  language: 'french' | 'korean'
  onComplete: (quality: number) => void
}

export default function PronunciationPractice({
  word,
  translation,
  language,
  onComplete
}: PronunciationPracticeProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [recognizedText, setRecognizedText] = useState('')
  const [result, setResult] = useState<'correct' | 'close' | 'incorrect' | null>(null)
  const [attempts, setAttempts] = useState(0)
  const [showWord, setShowWord] = useState(false)
  const [supported, setSupported] = useState(true)

  useEffect(() => {
    // Check if speech recognition is supported
    setSupported(isSpeechRecognitionSupported())
    
    // Auto-play the word when component loads
    setTimeout(() => {
      speakWord(word, language)
    }, 500)
  }, [word, language])

  async function handleStartRecording() {
    if (!supported) {
      alert('Speech recognition is not supported in your browser. Please try Chrome or Edge.')
      return
    }

    setIsRecording(true)
    setRecognizedText('')
    setResult(null)

    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      const recognition = new SpeechRecognition()

      recognition.lang = language === 'french' ? 'fr-FR' : 'ko-KR'
      recognition.interimResults = false
      recognition.maxAlternatives = 1

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript
        setRecognizedText(transcript)
        setAttempts(prev => prev + 1)
        
        // Compare with target word (case-insensitive, remove punctuation)
        const normalizedTranscript = transcript.toLowerCase().replace(/[.,!?]/g, '').trim()
        const normalizedWord = word.toLowerCase().replace(/[.,!?]/g, '').trim()
        
        let quality = 0
        let resultType: 'correct' | 'close' | 'incorrect' = 'incorrect'

        if (normalizedTranscript === normalizedWord) {
          // Perfect match
          quality = attempts === 0 ? 5 : 4
          resultType = 'correct'
        } else if (normalizedTranscript.includes(normalizedWord) || normalizedWord.includes(normalizedTranscript)) {
          // Close match (partial overlap)
          quality = 3
          resultType = 'close'
        } else {
          // Calculate similarity
          const similarity = calculateSimilarity(normalizedTranscript, normalizedWord)
          if (similarity > 0.6) {
            quality = 2
            resultType = 'close'
          } else {
            quality = 1
            resultType = 'incorrect'
          }
        }

        setResult(resultType)
        setIsRecording(false)

        if (resultType === 'correct') {
          setTimeout(() => {
            onComplete(quality)
          }, 2000)
        }
      }

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error)
        setIsRecording(false)
        if (event.error === 'no-speech') {
          alert('No speech detected. Please try again.')
        } else if (event.error === 'not-allowed') {
          alert('Microphone access denied. Please enable microphone permissions.')
        }
      }

      recognition.onend = () => {
        setIsRecording(false)
      }

      recognition.start()
    } catch (error) {
      console.error('Error starting speech recognition:', error)
      setIsRecording(false)
      alert('Failed to start speech recognition. Please try again.')
    }
  }

  function handleSkip() {
    // Skip with lower quality score
    onComplete(1)
  }

  function handleTryAgain() {
    setRecognizedText('')
    setResult(null)
  }

  function handleRevealWord() {
    setShowWord(true)
    speakWord(word, language)
  }

  // Simple similarity calculation (Levenshtein distance)
  function calculateSimilarity(s1: string, s2: string): number {
    const longer = s1.length > s2.length ? s1 : s2
    const shorter = s1.length > s2.length ? s2 : s1
    
    if (longer.length === 0) return 1.0
    
    const editDistance = levenshteinDistance(longer, shorter)
    return (longer.length - editDistance) / longer.length
  }

  function levenshteinDistance(s1: string, s2: string): number {
    const costs = []
    for (let i = 0; i <= s1.length; i++) {
      let lastValue = i
      for (let j = 0; j <= s2.length; j++) {
        if (i === 0) {
          costs[j] = j
        } else if (j > 0) {
          let newValue = costs[j - 1]
          if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
            newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1
          }
          costs[j - 1] = lastValue
          lastValue = newValue
        }
      }
      if (i > 0) costs[s2.length] = lastValue
    }
    return costs[s2.length]
  }

  if (!supported) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🎤</div>
        <h3 className="text-2xl font-bold text-gray-800 mb-4">
          Speech Recognition Not Supported
        </h3>
        <p className="text-gray-600 mb-6">
          This feature requires Chrome or Edge browser on desktop.
        </p>
        <button
          onClick={handleSkip}
          className="bg-purple-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-purple-700 transition"
        >
          Skip This Activity
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <div className="inline-block bg-purple-100 text-purple-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
          🎤 Pronunciation Practice
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Say this word in {language === 'french' ? 'French' : 'Korean'}
        </h2>
        <p className="text-gray-600">
          Listen to the word and try to pronounce it correctly
        </p>
      </div>

      {/* Word Display */}
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-8 mb-6 text-center">
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">English meaning:</p>
          <p className="text-2xl font-bold text-gray-800">{translation}</p>
        </div>

        {showWord && (
          <div className="mt-6 p-4 bg-white rounded-lg">
            <p className="text-sm text-gray-600 mb-2">Target word:</p>
            <p className="text-4xl font-bold text-purple-600">{word}</p>
          </div>
        )}

        <div className="flex justify-center gap-4 mt-6">
          <button
            onClick={() => speakWord(word, language)}
            className="flex items-center gap-2 bg-white px-6 py-3 rounded-lg shadow-md hover:shadow-lg transition"
          >
            <span className="text-2xl">🔊</span>
            <span className="font-medium">Listen Again</span>
          </button>

          {!showWord && (
            <button
              onClick={handleRevealWord}
              className="flex items-center gap-2 bg-white px-6 py-3 rounded-lg shadow-md hover:shadow-lg transition"
            >
              <span className="text-2xl">👁️</span>
              <span className="font-medium">Show Word</span>
            </button>
          )}
        </div>
      </div>

      {/* Recording Button */}
      {!result && (
        <div className="text-center mb-6">
          <button
            onClick={handleStartRecording}
            disabled={isRecording}
            className={`relative px-12 py-6 rounded-full font-bold text-xl transition-all transform ${
              isRecording
                ? 'bg-red-500 text-white scale-110 animate-pulse'
                : 'bg-purple-600 text-white hover:bg-purple-700 hover:scale-105'
            }`}
          >
            {isRecording ? (
              <>
                <span className="inline-block w-4 h-4 bg-white rounded-full mr-3 animate-pulse"></span>
                Recording...
              </>
            ) : (
              <>
                <span className="text-3xl mr-3">🎤</span>
                Start Recording
              </>
            )}
          </button>
          <p className="text-sm text-gray-500 mt-4">
            {attempts > 0 ? `Attempt ${attempts + 1}` : 'Tap to start recording'}
          </p>
        </div>
      )}

      {/* Recognized Text */}
      {recognizedText && (
        <div className="bg-white rounded-xl p-6 mb-6 shadow-lg">
          <p className="text-sm text-gray-600 mb-2">You said:</p>
          <p className="text-2xl font-bold text-gray-800">{recognizedText}</p>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className={`rounded-xl p-6 mb-6 text-center ${
          result === 'correct'
            ? 'bg-green-50 border-2 border-green-200'
            : result === 'close'
            ? 'bg-yellow-50 border-2 border-yellow-200'
            : 'bg-red-50 border-2 border-red-200'
        }`}>
          <div className="text-6xl mb-4">
            {result === 'correct' ? '🎉' : result === 'close' ? '👍' : '😅'}
          </div>
          <h3 className={`text-2xl font-bold mb-2 ${
            result === 'correct' ? 'text-green-700' : result === 'close' ? 'text-yellow-700' : 'text-red-700'
          }`}>
            {result === 'correct' ? 'Perfect!' : result === 'close' ? 'Close!' : 'Try Again'}
          </h3>
          <p className={`mb-4 ${
            result === 'correct' ? 'text-green-600' : result === 'close' ? 'text-yellow-600' : 'text-red-600'
          }`}>
            {result === 'correct'
              ? 'Great pronunciation!'
              : result === 'close'
              ? 'Almost there! Keep practicing.'
              : 'Not quite right. Listen carefully and try again.'}
          </p>

          {result !== 'correct' && (
            <div className="flex gap-3 justify-center">
              <button
                onClick={handleTryAgain}
                className="bg-white px-6 py-3 rounded-lg font-medium shadow-md hover:shadow-lg transition"
              >
                Try Again
              </button>
              <button
                onClick={handleSkip}
                className="bg-gray-100 px-6 py-3 rounded-lg font-medium hover:bg-gray-200 transition"
              >
                Skip
              </button>
            </div>
          )}
        </div>
      )}

      {/* Instructions */}
      <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-800">
        <p className="font-medium mb-2">💡 Tips:</p>
        <ul className="space-y-1">
          <li>• Listen carefully to the pronunciation</li>
          <li>• Speak clearly into your microphone</li>
          <li>• Don't worry about being perfect - accent is okay!</li>
          <li>• You can reveal the word if you need help</li>
        </ul>
      </div>
    </div>
  )
}