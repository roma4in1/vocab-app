// app/dashboard/progress/page.tsx

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser, getUserProfile } from '@/lib/auth'
import { getUserStats, getUpcomingReviews } from '@/lib/learning'
import { supabase } from '@/lib/supabase'
import { VocabularyWord } from '@/types/database'

interface DailyStatRecord {
  date: string
  words_reviewed: number
  perfect_answers: number
  completed_daily_goal: boolean
}

interface CycleHistory {
  cycle_number: number
  start_date: string
  end_date: string
  is_active: boolean
  words_count: number
}

export default function ProgressPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    wordsStudiedToday: 0,
    perfectToday: 0,
    currentStreak: 0,
    longestStreak: 0,
    totalWordsLearned: 0
  })
  const [dailyHistory, setDailyHistory] = useState<DailyStatRecord[]>([])
  const [cycleHistory, setCycleHistory] = useState<CycleHistory[]>([])
  const [upcomingReviews, setUpcomingReviews] = useState<Array<VocabularyWord & { reviewDate: string }>>([])
  const [targetLanguage, setTargetLanguage] = useState<'french' | 'korean'>('french')

  useEffect(() => {
    loadProgressData()
  }, [])

  async function loadProgressData() {
    try {
      const user = await getCurrentUser()
      if (!user) {
        router.push('/login')
        return
      }

      const profile = await getUserProfile(user.id)
      setTargetLanguage(profile.target_language)

      // Load user stats
      const userStats = await getUserStats(user.id)
      setStats(userStats)

      // Load daily history (last 30 days)
      const { data: dailyData } = await supabase
        .from('daily_stats')
        .select('date, words_reviewed, perfect_answers, completed_daily_goal')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(30)

      setDailyHistory(dailyData || [])

      // Load cycle history
      const partnerId = profile.partner_id || user.id
      const coupleId = [user.id, partnerId].sort().join('_')

      const { data: cycles } = await supabase
        .from('learning_cycles')
        .select('cycle_number, start_date, end_date, is_active, id')
        .eq('couple_id', coupleId)
        .order('cycle_number', { ascending: false })
        .limit(10)

      if (cycles) {
        // Get word count for each cycle
        const cyclesWithCounts = await Promise.all(
          cycles.map(async (cycle) => {
            const { data: words } = await supabase
              .from('cycle_words')
              .select('word_id', { count: 'exact' })
              .eq('cycle_id', cycle.id)
            
            return {
              ...cycle,
              words_count: words?.length || 0
            }
          })
        )
        setCycleHistory(cyclesWithCounts)
      }

      // Load upcoming reviews
      const upcoming = await getUpcomingReviews(user.id, 7)
      setUpcomingReviews(upcoming)

      setLoading(false)
    } catch (error) {
      console.error('Error loading progress:', error)
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your progress...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/dashboard')}
            className="text-purple-600 hover:text-purple-700 mb-4 flex items-center gap-2"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-800">Your Progress</h1>
          <p className="text-gray-600 mt-2">Track your learning journey</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Today</p>
            <p className="text-2xl font-bold text-blue-600">{stats.wordsStudiedToday}</p>
            <p className="text-xs text-gray-500">words</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Current Streak</p>
            <p className="text-2xl font-bold text-green-600">{stats.currentStreak}</p>
            <p className="text-xs text-gray-500">days 🔥</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Best Streak</p>
            <p className="text-2xl font-bold text-orange-600">{stats.longestStreak}</p>
            <p className="text-xs text-gray-500">days</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Total Learned</p>
            <p className="text-2xl font-bold text-purple-600">{stats.totalWordsLearned}</p>
            <p className="text-xs text-gray-500">words</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Perfect Today</p>
            <p className="text-2xl font-bold text-pink-600">{stats.perfectToday}</p>
            <p className="text-xs text-gray-500">answers</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Daily History */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Daily Activity</h2>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {dailyHistory.length > 0 ? (
                dailyHistory.map((day) => (
                  <div
                    key={day.date}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-gray-800">
                        {new Date(day.date).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </p>
                      <p className="text-sm text-gray-600">
                        {day.words_reviewed} words • {day.perfect_answers} perfect
                      </p>
                    </div>
                    {day.completed_daily_goal && (
                      <span className="text-green-600 text-xl">✅</span>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-8">No activity yet. Start learning!</p>
              )}
            </div>
          </div>

          {/* Upcoming Reviews */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Upcoming Reviews (7 Days)</h2>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {upcomingReviews.length > 0 ? (
                upcomingReviews.map((word) => (
                  <div
                    key={word.id}
                    className="flex items-center justify-between p-3 bg-purple-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-gray-800">
                        {targetLanguage === 'french' ? word.french_translation : word.korean_translation}
                      </p>
                      <p className="text-sm text-gray-600">{word.english_word}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-purple-600 font-medium">
                        {new Date(word.reviewDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-8">All caught up! 🎉</p>
              )}
            </div>
          </div>
        </div>

        {/* Cycle History */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mt-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Cycle History</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 text-gray-600 font-medium">Cycle</th>
                  <th className="text-left py-3 px-4 text-gray-600 font-medium">Dates</th>
                  <th className="text-left py-3 px-4 text-gray-600 font-medium">Words</th>
                  <th className="text-left py-3 px-4 text-gray-600 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {cycleHistory.length > 0 ? (
                  cycleHistory.map((cycle) => (
                    <tr key={cycle.cycle_number} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium text-gray-800">
                        Cycle #{cycle.cycle_number}
                      </td>
                      <td className="py-3 px-4 text-gray-600 text-sm">
                        {new Date(cycle.start_date).toLocaleDateString()} - {new Date(cycle.end_date).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {cycle.words_count} words
                      </td>
                      <td className="py-3 px-4">
                        {cycle.is_active ? (
                          <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                            Active
                          </span>
                        ) : (
                          <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm font-medium">
                            Completed
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-gray-500">
                      No cycle history yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}