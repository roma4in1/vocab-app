// lib/speech.ts
// ✅ COMPLETE: Speech utilities for Text-to-Speech and Speech Recognition

/**
 * Get the best available voice for a language
 * Prioritizes native voices over non-native ones
 */
function getBestVoice(language: 'french' | 'korean'): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices()
  const langCode = language === 'french' ? 'fr' : 'ko'
  
  // Priority 1: Exact match with local voice (fr-FR, ko-KR)
  const exactLocal = voices.find(voice => 
    voice.lang.startsWith(langCode) && voice.localService
  )
  if (exactLocal) return exactLocal
  
  // Priority 2: Any voice that starts with the language code and is local
  const anyLocal = voices.find(voice => 
    voice.lang.startsWith(langCode)
  )
  if (anyLocal) return anyLocal
  
  // Priority 3: Google/online voices for the language
  const onlineVoice = voices.find(voice => 
    voice.lang.startsWith(langCode) && !voice.localService
  )
  if (onlineVoice) return onlineVoice
  
  return null
}

/**
 * Speaks a word in the target language using Web Speech API
 * @param text - The word to speak
 * @param language - 'french' or 'korean'
 * @param rate - Speech rate (0.1 to 10, default 0.85 for learning)
 */
export function speakWord(
  text: string, 
  language: 'french' | 'korean',
  rate: number = 0.85
): void {
  // Check if browser supports speech synthesis
  if (!window.speechSynthesis) {
    console.warn('Speech synthesis not supported in this browser')
    return
  }

  // Cancel any ongoing speech
  window.speechSynthesis.cancel()

  const utterance = new SpeechSynthesisUtterance(text)
  
  // Set language code
  utterance.lang = language === 'french' ? 'fr-FR' : 'ko-KR'
  
  // Try to get the best voice for this language
  const bestVoice = getBestVoice(language)
  if (bestVoice) {
    utterance.voice = bestVoice
    console.log(`Using voice: ${bestVoice.name} (${bestVoice.lang})`)
  } else {
    console.warn(`No native ${language} voice found, using default`)
  }
  
  // Slightly slower rate for language learning
  utterance.rate = rate
  
  // Normal pitch and volume
  utterance.pitch = 1
  utterance.volume = 1

  // Speak the word
  window.speechSynthesis.speak(utterance)
}

/**
 * Stops any currently playing speech
 */
export function stopSpeaking(): void {
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel()
  }
}

/**
 * Check if Text-to-Speech is supported
 */
export function isTTSSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

/**
 * Check if Speech Recognition is supported
 */
export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false
  
  return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window
}

/**
 * Get all available voices for a language
 * Useful for displaying voice options to users
 */
export function getAvailableVoices(language?: 'french' | 'korean'): SpeechSynthesisVoice[] {
  if (!isTTSSupported()) return []
  
  const voices = window.speechSynthesis.getVoices()
  
  if (!language) return voices
  
  const langCode = language === 'french' ? 'fr' : 'ko'
  return voices.filter(voice => voice.lang.startsWith(langCode))
}

/**
 * Initialize speech synthesis (call this on page load to ensure voices are loaded)
 */
export function initializeSpeech(): Promise<void> {
  return new Promise((resolve) => {
    if (!isTTSSupported()) {
      resolve()
      return
    }

    // Voices might not be loaded immediately
    if (window.speechSynthesis.getVoices().length > 0) {
      resolve()
    } else {
      window.speechSynthesis.addEventListener('voiceschanged', () => {
        resolve()
      }, { once: true })
    }
  })
}