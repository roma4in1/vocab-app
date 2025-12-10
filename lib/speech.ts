// lib/speech.ts

export function speakWord(
  text: string, 
  language: 'french' | 'korean',
  rate: number = 0.85
): void {
  if (!window.speechSynthesis) {
    console.warn('Speech synthesis not supported')
    return
  }

  window.speechSynthesis.cancel()

  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = language === 'french' ? 'fr-FR' : 'ko-KR'
  utterance.rate = rate
  utterance.pitch = 1
  utterance.volume = 1

  const voices = window.speechSynthesis.getVoices()
  const langCode = language === 'french' ? 'fr' : 'ko'
  const voice = voices.find(v => v.lang.startsWith(langCode))
  
  if (voice) {
    utterance.voice = voice
  }

  window.speechSynthesis.speak(utterance)
}

export function stopSpeaking(): void {
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel()
  }
}

export function isTTSSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

export function isSpeechRecognitionSupported(): boolean {
  return typeof window !== 'undefined' && 
         ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
}

export function initializeSpeech(): Promise<void> {
  return new Promise((resolve) => {
    if (!isTTSSupported()) {
      resolve()
      return
    }

    if (window.speechSynthesis.getVoices().length > 0) {
      resolve()
    } else {
      window.speechSynthesis.addEventListener('voiceschanged', () => {
        resolve()
      }, { once: true })
    }
  })
}