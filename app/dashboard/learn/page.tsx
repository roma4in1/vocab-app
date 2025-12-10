// app/dashboard/learn/page.tsx

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser, getUserProfile } from '@/lib/auth'
import { 
  getWordsForReview,
  getCycleWords,
  updateWordProgress,
  updateDailyStats,
  getUserProgressForWords
} from '@/lib/learning'
import { VocabularyWord } from '@/types/database'
import { isSpeechRecognitionSupported } from '@/lib/speech'
import MultipleChoice from '@/components/learning-modes/MultipleChoice'
import ListeningComprehension from '@/components/learning-modes/ListeningComprehension'
import SentenceBuilder from '@/components/learning-modes/SentenceBuilder'
import PronunciationPractice from '@/components/learning-modes/PronunciationPractice'

// Adapter to convert database format to component format
interface AdaptedWord {
  id: string
  word: string
  translation: string
  language: 'french' | 'korean'
  repetition: number
}

// Activity represents one mode for one word
interface Activity {
  word: AdaptedWord
  modeType: ModeType
  activityId: string
}

type ModeType = 
  | 'multiple-choice-to-english'
  | 'multiple-choice-from-english'
  | 'listening-comprehension'
  | 'sentence-builder'
  | 'pronunciation-practice' // ✅ NEW MODE!

export default function LearnPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [activities, setActivities] = useState<Activity[]>([])
  const [allWords, setAllWords] = useState<AdaptedWord[]>([])
  const [currentActivityIndex, setCurrentActivityIndex] = useState(0)
  const [targetLanguage, setTargetLanguage] = useState<'french' | 'korean'>('french')
  const [userId, setUserId] = useState<string>('')
  const [cycleId, setCycleId] = useState<string>('')
  const [completed, setCompleted] = useState(false)
  const [activitiesCompleted, setActivitiesCompleted] = useState(0)
  const [wordQualities, setWordQualities] = useState<Record<string, number[]>>({})
  const [speechRecognitionAvailable, setSpeechRecognitionAvailable] = useState(false)

  useEffect(() => {
    // Check speech recognition support
    setSpeechRecognitionAvailable(isSpeechRecognitionSupported())
    loadLearningSession()
  }, [])

  async function loadLearningSession() {
    try {
      const user = await getCurrentUser()
      if (!user) {
        router.push('/login')
        return
      }

      const profile = await getUserProfile(user.id)
      setUserId(user.id)
      setTargetLanguage(profile.target_language)

      // Check and create new cycle if needed (AUTOMATIC!)
      const { checkAndCreateNewCycle } = await import('@/lib/cycles')
      const cycle = await checkAndCreateNewCycle(user.id)
      
      if (!cycle) {
        alert('Failed to create learning cycle. Please try again.')
        router.push('/dashboard')
        return
      }

      setCycleId(cycle.id)

      // Get words due for review first
      let dueWords = await getWordsForReview(user.id, cycle.id)
      
      // If no words due, get ALL cycle words for unlimited practice
      if (dueWords.length === 0) {
        console.log('No words due - loading all cycle words for practice')
        dueWords = await getCycleWords(cycle.id)
      }
      
      if (dueWords.length === 0) {
        // No words available at all
        setCompleted(true)
        setLoading(false)
        return
      }

      // Get progress data for these words
      const wordIds = dueWords.map(w => w.id)
      const progress = await getUserProgressForWords(user.id, cycle.id, wordIds)
      
      // Convert to adapted format
      const adaptedWords = dueWords.map(word => {
        const wordProgress = progress.find(p => p.word_id === word.id)
        const translation = profile.target_language === 'french' 
          ? word.french_translation 
          : word.korean_translation

        return {
          id: word.id,
          word: translation,
          translation: word.english_word,
          language: profile.target_language,
          repetition: wordProgress?.repetitions || 0
        }
      })

      setAllWords(adaptedWords)

      // Generate multiple activities per word, then SHUFFLE
      const generatedActivities = generateAndShuffleActivities(adaptedWords)
      
      setActivities(generatedActivities)
      setLoading(false)
    } catch (error) {
      console.error('Error loading learning session:', error)
      alert('Failed to load learning session')
      router.push('/dashboard')
    }
  }

  // Generate 2-3 activities per word, then SHUFFLE for interleaving
  function generateAndShuffleActivities(words: AdaptedWord[]): Activity[] {
    const allActivities: Activity[] = []

    // Generate activities for each word
    words.forEach(word => {
      const modes = selectModesForWord(word)
      
      modes.forEach((modeType, index) => {
        allActivities.push({
          word,
          modeType,
          activityId: `${word.id}-${modeType}-${index}`
        })
      })
    })

    // SHUFFLE activities for better retention (interleaving)
    return shuffleArray(allActivities)
  }

  // ✅ UPDATED: Select 2-3 modes for each word (including pronunciation practice)
  function selectModesForWord(word: AdaptedWord): ModeType[] {
    let availableModes: ModeType[] = [
      'multiple-choice-to-english',
      'multiple-choice-from-english',
      'listening-comprehension',
      'sentence-builder'
    ]

    // ✅ Add pronunciation practice if supported
    if (speechRecognitionAvailable) {
      availableModes.push('pronunciation-practice')
    }

    // For new words (repetition 0-1), use 3 different modes
    // For familiar words, use 2 modes
    const modeCount = word.repetition <= 1 ? 3 : 2

    // Shuffle and take first N modes
    const shuffled = shuffleArray([...availableModes])
    return shuffled.slice(0, modeCount)
  }

  // Shuffle array using Fisher-Yates algorithm
  function shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }

  // Handle activity completion with proper state management
  async function handleComplete(wordId: string, quality: number) {
    try {
      // 1. Calculate updated qualities IMMEDIATELY (before setState)
      const updatedQualities = {
        ...wordQualities,
        [wordId]: [...(wordQualities[wordId] || []), quality]
      }
      setWordQualities(updatedQualities)

      // 2. Increment activities completed
      const newActivitiesCompleted = activitiesCompleted + 1
      setActivitiesCompleted(newActivitiesCompleted)

      // 3. Check if this is the last activity
      if (currentActivityIndex < activities.length - 1) {
        // More activities remaining - move to next
        setCurrentActivityIndex(prev => prev + 1)
      } else {
        // This was the last activity - save all progress and complete
        console.log('Last activity completed, saving progress...')
        
        // Calculate average quality for each word using the updated qualities
        const wordProgressUpdates = Object.keys(updatedQualities).map(wId => {
          const qualities = updatedQualities[wId]
          const avgQuality = Math.round(
            qualities.reduce((sum, q) => sum + q, 0) / qualities.length
          )
          return { wordId: wId, avgQuality }
        })

        // Save all word progress
        for (const { wordId: wId, avgQuality } of wordProgressUpdates) {
          await updateWordProgress(userId, wId, cycleId, avgQuality)
        }
        
        // Update daily stats
        await updateDailyStats(userId, wordProgressUpdates.length)
        
        // Mark as completed
        setCompleted(true)
      }
    } catch (error) {
      console.error('Error updating progress:', error)
      alert('Failed to save progress. Please try again.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your learning session...</p>
        </div>
      </div>
    )
  }

  if (completed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12 max-w-md w-full text-center">
          <div className="text-6xl mb-6 animate-bounce">🎉</div>
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            Session Complete!
          </h2>
          <p className="text-gray-600 mb-2">
            You practiced <span className="font-bold text-purple-600">{Object.keys(wordQualities).length}</span> words
          </p>
          <p className="text-gray-600 mb-8">
            Completed <span className="font-bold text-blue-600">{activitiesCompleted}</span> activities
          </p>
          
          <div className="space-y-3">
            <button
              onClick={() => router.push('/dashboard')}
              className="w-full bg-purple-600 text-white py-3 rounded-lg font-medium hover:bg-purple-700 transition"
            >
              Back to Dashboard
            </button>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-white border-2 border-purple-600 text-purple-600 py-3 rounded-lg font-medium hover:bg-purple-50 transition"
            >
              Practice Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  const currentActivity = activities[currentActivityIndex]
  
  if (!currentActivity) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>No activities available</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-4">
      <div className="max-w-3xl mx-auto">
        {/* Progress Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <p className="text-sm text-gray-600">Activity Progress</p>
              <p className="text-2xl font-bold text-purple-600">
                {currentActivityIndex + 1} / {activities.length}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Words Practiced</p>
              <p className="text-2xl font-bold text-blue-600">
                {Object.keys(wordQualities).length} / {allWords.length}
              </p>
            </div>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all duration-300"
              style={{ width: `${((currentActivityIndex + 1) / activities.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Activity Content */}
        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
          {currentActivity.modeType === 'multiple-choice-to-english' && (
            <MultipleChoice
              word={currentActivity.word.word}
              correctTranslation={currentActivity.word.translation}
              incorrectOptions={getIncorrectOptions(currentActivity.word.translation, 'english')}
              language={targetLanguage}
              direction="to-english"
              onComplete={(quality) => handleComplete(currentActivity.word.id, quality)}
            />
          )}

          {currentActivity.modeType === 'multiple-choice-from-english' && (
            <MultipleChoice
              word={currentActivity.word.translation}
              correctTranslation={currentActivity.word.word}
              incorrectOptions={getIncorrectOptions(currentActivity.word.word, targetLanguage)}
              language={targetLanguage}
              direction="from-english"
              onComplete={(quality) => handleComplete(currentActivity.word.id, quality)}
            />
          )}

          {currentActivity.modeType === 'listening-comprehension' && (
            <ListeningComprehension
              word={currentActivity.word.word}
              correctTranslation={currentActivity.word.translation}
              incorrectOptions={getIncorrectOptions(currentActivity.word.translation, 'english')}
              language={targetLanguage}
              onComplete={(quality) => handleComplete(currentActivity.word.id, quality)}
            />
          )}

          {currentActivity.modeType === 'sentence-builder' && (
            <SentenceBuilder
              word={currentActivity.word.word}
              translation={currentActivity.word.translation}
              language={targetLanguage}
              onComplete={(quality) => handleComplete(currentActivity.word.id, quality)}
            />
          )}

          {/* ✅ NEW: Pronunciation Practice Mode */}
          {currentActivity.modeType === 'pronunciation-practice' && (
            <PronunciationPractice
              word={currentActivity.word.word}
              translation={currentActivity.word.translation}
              language={targetLanguage}
              onComplete={(quality) => handleComplete(currentActivity.word.id, quality)}
            />
          )}
        </div>

        {/* Exit Button */}
        <div className="mt-6 text-center">
          <button
            onClick={() => {
              if (confirm('Are you sure you want to exit? Your progress will be saved.')) {
                router.push('/dashboard')
              }
            }}
            className="text-gray-500 hover:text-gray-700 text-sm"
          >
            Exit Session
          </button>
        </div>
      </div>
    </div>
  )

  // Helper function to get incorrect options
  function getIncorrectOptions(correctAnswer: string, language: 'english' | 'french' | 'korean'): string[] {
    const options = allWords
      .filter(w => {
        if (language === 'english') {
          return w.translation !== correctAnswer
        } else {
          return w.word !== correctAnswer
        }
      })
      .map(w => language === 'english' ? w.translation : w.word)

    // Shuffle and take 3
    const shuffled = shuffleArray(options)
    return shuffled.slice(0, 3)
  }
}