// Speech utilities for Text-to-Speech and Speech Recognition

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
 * Start speech recognition for a specific language
 * Returns a promise that resolves with the recognized text
 * @param language - 'french' or 'korean'
 * @param onResult - Callback for interim results (optional)
 */
export function recognizeSpeech(
  language: 'french' | 'korean',
  onResult?: (transcript: string, isFinal: boolean) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!isSpeechRecognitionSupported()) {
      reject(new Error('Speech recognition not supported'))
      return
    }

    // Get the recognition constructor (with webkit prefix for Safari)
    const SpeechRecognition = 
      (window as any).SpeechRecognition || 
      (window as any).webkitSpeechRecognition

    const recognition = new SpeechRecognition()

    // Set language
    recognition.lang = language === 'french' ? 'fr-FR' : 'ko-KR'
    
    // Recognition settings
    recognition.continuous = false // Stop after one result
    recognition.interimResults = true // Get interim results for feedback
    recognition.maxAlternatives = 1 // We only need the best guess

    let finalTranscript = ''

    recognition.onresult = (event: any) => {
      let interimTranscript = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript

        if (event.results[i].isFinal) {
          finalTranscript += transcript
        } else {
          interimTranscript += transcript
        }
      }

      // Call the callback with interim results if provided
      if (onResult) {
        if (interimTranscript) {
          onResult(interimTranscript, false)
        }
        if (finalTranscript) {
          onResult(finalTranscript, true)
        }
      }
    }

    recognition.onend = () => {
      if (finalTranscript) {
        resolve(finalTranscript.trim())
      } else {
        reject(new Error('No speech detected'))
      }
    }

    recognition.onerror = (event: any) => {
      reject(new Error(`Speech recognition error: ${event.error}`))
    }

    // Start recognition
    try {
      recognition.start()
    } catch (error) {
      reject(error)
    }
  })
}

/**
 * Compare recognized speech with target word
 * Returns a similarity score from 0 to 5
 * @param recognized - What the user said
 * @param target - What they should have said
 */
export function calculatePronunciationScore(
  recognized: string,
  target: string
): number {
  // Normalize both strings (lowercase, trim)
  const normalizedRecognized = recognized.toLowerCase().trim()
  const normalizedTarget = target.toLowerCase().trim()

  // Exact match
  if (normalizedRecognized === normalizedTarget) {
    return 5
  }

  // Calculate Levenshtein distance for similarity
  const distance = levenshteinDistance(normalizedRecognized, normalizedTarget)
  const maxLength = Math.max(normalizedRecognized.length, normalizedTarget.length)
  const similarity = 1 - (distance / maxLength)

  // Convert similarity to score (0-5 scale)
  // We're lenient because of accents and pronunciation variations
  if (similarity >= 0.9) return 5 // Very close
  if (similarity >= 0.75) return 4 // Pretty good
  if (similarity >= 0.6) return 3 // Okay
  if (similarity >= 0.4) return 2 // Struggled
  return 1 // Wrong word
}

/**
 * Calculate Levenshtein distance (edit distance) between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = []

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i]
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        )
      }
    }
  }

  return matrix[str2.length][str1.length]
}