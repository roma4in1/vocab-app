'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser, getUserProfile } from '@/lib/auth'
import { 
  getCurrentCycle, 
  getWordsForReview,
  updateWordProgress,
  updateDailyStats
} from '@/lib/learning'
import { VocabularyWord } from '@/types/database'
import Flashcard from '@/components/Flashcard'

export default function LearnPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [words, setWords] = useState<VocabularyWord[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [targetLanguage, setTargetLanguage] = useState<'french' | 'korean'>('french')
  const [userId, setUserId] = useState<string>('')
  const [cycleId, setCycleId] = useState<string>('')
  const [completed, setCompleted] = useState(false)
  const [wordsReviewed, setWordsReviewed] = useState(0)

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
    const { getWordsForReview } = await import('@/lib/learning')
    const dueWords = await getWordsForReview(user.id, cycle.id)
    
    if (dueWords.length === 0) {
      setCompleted(true)
      setLoading(false)
      return
    }

    setWords(dueWords)
    setLoading(false)
  } catch (error) {
    console.error('Error loading learning session:', error)
    alert('Failed to load learning session')
    router.push('/dashboard')
  }
}

  async function handleRate(score: number) {
    try {
      await updateWordProgress(userId, words[currentIndex].id, cycleId, score)
      setWordsReviewed(prev => prev + 1)

      // Move to next word
      if (currentIndex < words.length - 1) {
        setCurrentIndex(prev => prev + 1)
      } else {
        // Update daily stats when session is complete
        await updateDailyStats(userId)
        setCompleted(true)
      }
    } catch (error) {
      console.error('Error updating progress:', error)
      alert('Failed to save progress')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading your words...</div>
      </div>
    )
  }

  if (completed || words.length === 0) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50">
      <div className="text-center bg-white p-12 rounded-3xl shadow-2xl max-w-lg">
        <div className="text-6xl mb-4">
          {wordsReviewed > 0 ? '🎉' : '✨'}
        </div>
        <h2 className="text-3xl font-bold mb-4">
          {wordsReviewed > 0 ? 'Great Job!' : 'All Caught Up!'}
        </h2>
        <p className="text-gray-600 mb-2">
          {wordsReviewed > 0 ? (
            <>You reviewed <span className="font-bold text-purple-600">{wordsReviewed}</span> words today!</>
          ) : (
            'No words are due for review right now.'
          )}
        </p>
        <p className="text-gray-600 mb-8">
          {wordsReviewed > 0 ? "Your cat is happy! 🐱" : "Come back later for more practice! 🐱"}
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Word {currentIndex + 1} of {words.length}</span>
            <span>{Math.round(((currentIndex + 1) / words.length) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / words.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Flashcard */}
        <Flashcard
          word={words[currentIndex]}
          targetLanguage={targetLanguage}
          onRate={handleRate}
        />
      </div>
    </div>
  )
}