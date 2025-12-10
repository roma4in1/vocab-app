'use client'

import { useState } from 'react'
import { speakWord, recognizeSpeech, isTTSSupported, isSpeechRecognitionSupported, calculatePronunciationScore } from '@/lib/speech'

export default function SpeechTestPage() {
  const [testLanguage, setTestLanguage] = useState<'french' | 'korean'>('french')
  const [testWord, setTestWord] = useState('bonjour')
  const [isListening, setIsListening] = useState(false)
  const [recognizedText, setRecognizedText] = useState('')
  const [pronunciationScore, setPronunciationScore] = useState<number | null>(null)

  const ttsSupported = isTTSSupported()
  const sttSupported = isSpeechRecognitionSupported()

  function handleTestSpeak() {
    speakWord(testWord, testLanguage)
  }

  async function handleTestRecognize() {
    setIsListening(true)
    setRecognizedText('')
    setPronunciationScore(null)

    try {
      const result = await recognizeSpeech(
        testLanguage,
        (transcript, isFinal) => {
          setRecognizedText(transcript)
        }
      )
      
      setRecognizedText(result)
      
      // Calculate score
      const score = calculatePronunciationScore(result, testWord)
      setPronunciationScore(score)
      
    } catch (error: any) {
      console.error('Speech recognition error:', error)
      alert(`Speech recognition failed: ${error.message}`)
    } finally {
      setIsListening(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-800 mb-8 text-center">
          🎤 Speech Features Test
        </h1>

        {/* Support Status */}
        <div className="bg-white rounded-xl p-6 mb-6 shadow-lg">
          <h2 className="text-xl font-bold mb-4">Browser Support</h2>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span>Text-to-Speech (TTS):</span>
              <span className={ttsSupported ? 'text-green-600 font-bold' : 'text-red-600'}>
                {ttsSupported ? '✅ Supported' : '❌ Not Supported'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Speech Recognition (STT):</span>
              <span className={sttSupported ? 'text-green-600 font-bold' : 'text-red-600'}>
                {sttSupported ? '✅ Supported' : '❌ Not Supported'}
              </span>
            </div>
          </div>
        </div>

        {/* Language Selector */}
        <div className="bg-white rounded-xl p-6 mb-6 shadow-lg">
          <h2 className="text-xl font-bold mb-4">Select Language</h2>
          <div className="flex gap-4">
            <button
              onClick={() => {
                setTestLanguage('french')
                setTestWord('bonjour')
              }}
              className={`flex-1 py-3 rounded-lg font-medium transition ${
                testLanguage === 'french'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              🇫🇷 French
            </button>
            <button
              onClick={() => {
                setTestLanguage('korean')
                setTestWord('안녕하세요')
              }}
              className={`flex-1 py-3 rounded-lg font-medium transition ${
                testLanguage === 'korean'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              🇰🇷 Korean
            </button>
          </div>
        </div>

        {/* Test Word Input */}
        <div className="bg-white rounded-xl p-6 mb-6 shadow-lg">
          <h2 className="text-xl font-bold mb-4">Test Word</h2>
          <input
            type="text"
            value={testWord}
            onChange={(e) => setTestWord(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg"
            placeholder="Enter a word to test..."
          />
        </div>

        {/* Text-to-Speech Test */}
        {ttsSupported && (
          <div className="bg-white rounded-xl p-6 mb-6 shadow-lg">
            <h2 className="text-xl font-bold mb-4">🔊 Text-to-Speech Test</h2>
            <p className="text-gray-600 mb-4">
              Click the button to hear "{testWord}" in {testLanguage}
            </p>
            <button
              onClick={handleTestSpeak}
              className="w-full bg-purple-600 text-white py-4 rounded-lg font-medium hover:bg-purple-700 transition"
            >
              🔊 Speak Word
            </button>
          </div>
        )}

        {/* Speech Recognition Test */}
        {sttSupported && (
          <div className="bg-white rounded-xl p-6 mb-6 shadow-lg">
            <h2 className="text-xl font-bold mb-4">🎤 Speech Recognition Test</h2>
            <p className="text-gray-600 mb-4">
              Click the button and say "{testWord}" in {testLanguage}
            </p>
            <button
              onClick={handleTestRecognize}
              disabled={isListening}
              className={`w-full py-4 rounded-lg font-medium transition ${
                isListening
                  ? 'bg-red-500 text-white animate-pulse'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {isListening ? '🎤 Listening...' : '🎤 Start Recording'}
            </button>

            {/* Recognition Results */}
            {recognizedText && (
              <div className="mt-6 space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">You said:</p>
                  <p className="text-xl font-bold text-gray-800">{recognizedText}</p>
                </div>

                {pronunciationScore !== null && (
                  <div className="bg-purple-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">Pronunciation Score:</p>
                    <p className="text-3xl font-bold text-purple-600">
                      {pronunciationScore}/5
                    </p>
                    <p className="text-sm text-gray-600 mt-2">
                      {pronunciationScore === 5 && '🎉 Perfect!'}
                      {pronunciationScore === 4 && '😊 Very good!'}
                      {pronunciationScore === 3 && '👍 Good effort!'}
                      {pronunciationScore === 2 && '🤔 Keep practicing!'}
                      {pronunciationScore === 1 && '💪 Try again!'}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Not Supported Message */}
        {(!ttsSupported && !sttSupported) && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6">
            <p className="text-red-800 font-medium">
              ⚠️ Speech features are not supported on your current browser/device.
            </p>
            <p className="text-red-600 text-sm mt-2">
              Try using Chrome, Safari, or Edge on a supported device.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}