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
import { VocabularyWord, UserProgress } from '@/types/database'
import MultipleChoice from '@/components/learning-modes/MultipleChoice'
import ListeningComprehension from '@/components/learning-modes/ListeningComprehension'
import SentenceBuilder from '@/components/learning-modes/SentenceBuilder'

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

  useEffect(() => {
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
        alert('You need to set up your learning cycle first!')
        router.push('/dashboard')
        return
      }

      setCycleId(cycle.id)

      // Get words due for review using SM-2
      let dueWords = await getWordsForReview(user.id, cycle.id)
      
      // ✅ NEW: If no words due, get all words from current cycle for unlimited practice
      if (dueWords.length === 0) {
        console.log('No words due - loading all cycle words for practice')
        dueWords = await getCycleWords(cycle.id)
      }
      
      if (dueWords.length === 0) {
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

      // Generate multiple activities per word (2-3 modes per word)
      // Then SHUFFLE them for better retention!
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

  // Select 2-3 modes for each word based on repetition level
  function selectModesForWord(word: AdaptedWord): ModeType[] {
    const { repetition } = word
    const availableModes: ModeType[] = []

    // New words (0-2 reps): Recognition focus
    if (repetition <= 2) {
      availableModes.push(
        'listening-comprehension',
        'multiple-choice-to-english'
      )
      // Sometimes add a third activity for new words
      if (Math.random() > 0.5) {
        availableModes.push('multiple-choice-from-english')
      }
    }
    // Learning words (3-5 reps): Mixed practice
    else if (repetition <= 5) {
      availableModes.push(
        'listening-comprehension',
        'multiple-choice-from-english'
      )
      // Add sentence builder sometimes
      if (Math.random() > 0.3) {
        availableModes.push('sentence-builder')
      }
    }
    // Familiar words (6+ reps): Production focus
    else {
      availableModes.push(
        'multiple-choice-from-english',
        'sentence-builder'
      )
      // Sometimes still practice listening
      if (Math.random() > 0.5) {
        availableModes.push('listening-comprehension')
      }
    }

    return availableModes
  }

  // Shuffle array (Fisher-Yates algorithm)
  function shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }

  // Generate incorrect options for multiple choice
  function generateIncorrectOptions(currentWord: AdaptedWord): string[] {
    const otherWords = allWords.filter(w => w.id !== currentWord.id)
    const shuffled = shuffleArray(otherWords)
    return shuffled.slice(0, 3).map(w => w.translation)
  }

  async function handleComplete(wordId: string, quality: number) {
    try {
      // Store quality score for this word
      const updatedQualities = {
        ...wordQualities,
        [wordId]: [...(wordQualities[wordId] || []), quality]
      }
      setWordQualities(updatedQualities)

      const nextActivityIndex = currentActivityIndex + 1
      setActivitiesCompleted(nextActivityIndex)

      // Check if this is the last activity
      if (nextActivityIndex >= activities.length) {
        // All activities done! Save progress using the updated qualities
        await saveWordProgressWithQualities(updatedQualities)
        
        // Update daily stats
        await updateDailyStats(userId)
        
        // Show completion screen
        setCompleted(true)
      } else {
        // Move to next activity
        setCurrentActivityIndex(nextActivityIndex)
      }
    } catch (error) {
      console.error('Error updating progress:', error)
      alert('Failed to save progress')
    }
  }

  // Save progress for all words using average quality
  async function saveWordProgressWithQualities(qualities: Record<string, number[]>) {
    const uniqueWordIds = Object.keys(qualities)
    
    for (const wordId of uniqueWordIds) {
      const wordScores = qualities[wordId]
      // Calculate average quality (rounded)
      const avgQuality = Math.round(
        wordScores.reduce((sum, q) => sum + q, 0) / wordScores.length
      )
      
      await updateWordProgress(userId, wordId, cycleId, avgQuality)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-bounce">🐱</div>
          <div className="text-lg text-gray-700">Loading your words...</div>
        </div>
      </div>
    )
  }

  if (completed || activities.length === 0) {
    const uniqueWords = Object.keys(wordQualities).length
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="text-center bg-white p-12 rounded-3xl shadow-2xl max-w-lg">
          <div className="text-6xl mb-4">
            {activitiesCompleted > 0 ? '🎉' : '✨'}
          </div>
          <h2 className="text-3xl font-bold mb-4">
            {activitiesCompleted > 0 ? 'Great Job!' : 'All Caught Up!'}
          </h2>
          <p className="text-gray-600 mb-2">
            {activitiesCompleted > 0 ? (
              <>
                You completed <span className="font-bold text-purple-600">{activitiesCompleted}</span> activities
                <br />
                across <span className="font-bold text-purple-600">{uniqueWords}</span> words!
              </>
            ) : (
              'No words in your current cycle.'
            )}
          </p>
          <p className="text-gray-600 mb-8">
            {activitiesCompleted > 0 ? "Your cat is happy! 🐱" : "Add more words to your cycle! 🐱"}
          </p>
          <button
            onClick={() => {
              // Force a full page reload to refresh stats
              window.location.href = '/dashboard'
            }}
            className="bg-purple-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-purple-700 transition"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  const currentActivity = activities[currentActivityIndex]
  const incorrectOptions = generateIncorrectOptions(currentActivity.word)

  // Render the correct mode component based on activity type
  function renderActivityMode() {
    const { word, modeType, activityId } = currentActivity

    switch (modeType) {
      case 'listening-comprehension':
        return (
          <ListeningComprehension
            key={activityId}
            word={word.word}
            correctTranslation={word.translation}
            incorrectOptions={incorrectOptions}
            language={word.language}
            onComplete={(quality) => handleComplete(word.id, quality)}
          />
        )

      case 'multiple-choice-to-english':
        return (
          <MultipleChoice
            key={activityId}
            word={word.word}
            correctTranslation={word.translation}
            incorrectOptions={incorrectOptions}
            language={word.language}
            questionType="toEnglish"
            onComplete={(quality) => handleComplete(word.id, quality)}
          />
        )

      case 'multiple-choice-from-english':
        return (
          <MultipleChoice
            key={activityId}
            word={word.word}
            correctTranslation={word.translation}
            incorrectOptions={incorrectOptions}
            language={word.language}
            questionType="fromEnglish"
            onComplete={(quality) => handleComplete(word.id, quality)}
          />
        )

      case 'sentence-builder':
        return (
          <SentenceBuilder
            key={activityId}
            word={word.word}
            translation={word.translation}
            language={word.language}
            onComplete={(quality) => handleComplete(word.id, quality)}
          />
        )

      default:
        return <div>Unknown mode: {modeType}</div>
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      {/* Progress Bar */}
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-sm shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Activity {currentActivityIndex + 1} of {activities.length}</span>
            <span>{Math.round(((currentActivityIndex + 1) / activities.length) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all duration-300"
              style={{ width: `${((currentActivityIndex + 1) / activities.length) * 100}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">
            {Object.keys(wordQualities).length} of {allWords.length} words practiced
          </p>
        </div>
      </div>

      {/* Render the current activity mode */}
      <div className="max-w-4xl mx-auto">
        {renderActivityMode()}
      </div>
    </div>
  )
}