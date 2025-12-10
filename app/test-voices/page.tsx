'use client'

import { useEffect, useState } from 'react'

export default function VoiceTesterPage() {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const [testText, setTestText] = useState('bonjour')

  useEffect(() => {
    // Load voices
    function loadVoices() {
      const availableVoices = window.speechSynthesis.getVoices()
      setVoices(availableVoices)
    }

    // Voices might load asynchronously
    loadVoices()
    window.speechSynthesis.onvoiceschanged = loadVoices
  }, [])

  function testVoice(voice: SpeechSynthesisVoice) {
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(testText)
    utterance.voice = voice
    utterance.rate = 0.85
    window.speechSynthesis.speak(utterance)
  }

  const frenchVoices = voices.filter(v => v.lang.startsWith('fr'))
  const koreanVoices = voices.filter(v => v.lang.startsWith('ko'))
  const otherVoices = voices.filter(v => !v.lang.startsWith('fr') && !v.lang.startsWith('ko'))

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">🎤 Voice Tester</h1>
        <p className="text-gray-600 mb-8">
          See what voices are available on your device
        </p>

        {/* Test Text Input */}
        <div className="bg-white rounded-xl p-6 mb-6 shadow-lg">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Test Text:
          </label>
          <input
            type="text"
            value={testText}
            onChange={(e) => setTestText(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            placeholder="Enter text to test..."
          />
          <p className="text-sm text-gray-500 mt-2">
            Try: "bonjour" for French, "안녕하세요" for Korean
          </p>
        </div>

        {/* French Voices */}
        <div className="bg-white rounded-xl p-6 mb-6 shadow-lg">
          <h2 className="text-2xl font-bold mb-4">🇫🇷 French Voices ({frenchVoices.length})</h2>
          {frenchVoices.length === 0 ? (
            <p className="text-red-600">⚠️ No French voices found on this device</p>
          ) : (
            <div className="space-y-3">
              {frenchVoices.map((voice, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition"
                >
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">{voice.name}</p>
                    <p className="text-sm text-gray-600">
                      {voice.lang} • {voice.localService ? '📱 Local' : '☁️ Online'}
                    </p>
                  </div>
                  <button
                    onClick={() => testVoice(voice)}
                    className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition"
                  >
                    🔊 Test
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Korean Voices */}
        <div className="bg-white rounded-xl p-6 mb-6 shadow-lg">
          <h2 className="text-2xl font-bold mb-4">🇰🇷 Korean Voices ({koreanVoices.length})</h2>
          {koreanVoices.length === 0 ? (
            <p className="text-red-600">⚠️ No Korean voices found on this device</p>
          ) : (
            <div className="space-y-3">
              {koreanVoices.map((voice, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition"
                >
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">{voice.name}</p>
                    <p className="text-sm text-gray-600">
                      {voice.lang} • {voice.localService ? '📱 Local' : '☁️ Online'}
                    </p>
                  </div>
                  <button
                    onClick={() => testVoice(voice)}
                    className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition"
                  >
                    🔊 Test
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Other Voices */}
        <details className="bg-white rounded-xl p-6 shadow-lg">
          <summary className="text-xl font-bold cursor-pointer">
            Other Voices ({otherVoices.length})
          </summary>
          <div className="space-y-2 mt-4">
            {otherVoices.map((voice, index) => (
              <div key={index} className="text-sm text-gray-600">
                {voice.name} ({voice.lang})
              </div>
            ))}
          </div>
        </details>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mt-6">
          <h3 className="font-bold text-blue-900 mb-2">📱 About Voice Quality</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• <strong>Local voices</strong> are stored on your device (better privacy, offline)</li>
            <li>• <strong>Online voices</strong> use internet (better quality, need connection)</li>
            <li>• iOS devices may have limited language voices installed</li>
            <li>• You can download more voices in Settings → Accessibility → Spoken Content</li>
          </ul>
        </div>
      </div>
    </div>
  )
}