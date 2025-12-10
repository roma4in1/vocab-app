// app/dashboard/page.tsx
// ✅ FIXED: Dashboard supporting both SOLO and PARTNER modes

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser, getUserProfile } from '@/lib/auth'
import { getCycleInfo, CycleInfo } from '@/lib/cycles'
import { getUserStats } from '@/lib/learning'
import { supabase } from '@/lib/supabase'
import { User } from '@/types/database'
import VocabCat from '@/components/VocabCat'
import { calculateHappinessFromDatabase, getCatMoodDescription } from '@/lib/catHappiness'

export default function DashboardPage() {
  const router = useRouter()
  const [userProfile, setUserProfile] = useState<User | null>(null)
  const [partnerProfile, setPartnerProfile] = useState<User | null>(null)
  const [cycleInfo, setCycleInfo] = useState<{
    cycle: CycleInfo | null
    userProgress: number
    partnerProgress: number
    isSolo: boolean
  }>({ cycle: null, userProgress: 0, partnerProgress: 0, isSolo: true })
  const [userStats, setUserStats] = useState({ 
    wordsStudiedToday: 0, 
    currentStreak: 0,
    longestStreak: 0,
    totalWordsLearned: 0
  })
  const [partnerStats, setPartnerStats] = useState({ 
    wordsStudiedToday: 0, 
    currentStreak: 0 
  })
  const [catHappiness, setCatHappiness] = useState(50)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  async function loadDashboardData() {
    try {
      const user = await getCurrentUser()
      if (!user) {
        router.push('/login')
        return
      }

      const profile = await getUserProfile(user.id)
      setUserProfile(profile)

      // Load cycle info (works for both solo and partner)
      const cycleData = await getCycleInfo(user.id)
      console.log('Cycle data:', cycleData)
      setCycleInfo(cycleData)

      // Load user stats
      const stats = await getUserStats(user.id)
      setUserStats(stats)

      // Load partner profile and stats if partnered
      if (profile.partner_id) {
        const partner = await getUserProfile(profile.partner_id)
        setPartnerProfile(partner)

        // Load partner stats
        const partnerStatsData = await getUserStats(profile.partner_id)
        setPartnerStats({
          wordsStudiedToday: partnerStatsData.wordsStudiedToday,
          currentStreak: partnerStatsData.currentStreak
        })

        // Load cat happiness (partner mode)
        const coupleId = [profile.id, profile.partner_id].sort().join('_')
        const { data: catData } = await supabase
          .from('cat_state')
          .select('happiness_level')
          .eq('couple_id', coupleId)
          .maybeSingle()

        if (catData) {
          setCatHappiness(catData.happiness_level)
        } else {
          // Calculate based on both partners' progress
          const happiness = calculateHappinessFromDatabase(
            {
              words_studied_today: stats.wordsStudiedToday,
              current_streak: stats.currentStreak
            },
            {
              words_studied_today: partnerStatsData.wordsStudiedToday,
              current_streak: partnerStatsData.currentStreak
            }
          )
          setCatHappiness(happiness)
        }
      } else {
        // Solo mode: calculate happiness based only on user
        const happiness = calculateHappinessFromDatabase({
          words_studied_today: stats.wordsStudiedToday,
          current_streak: stats.currentStreak
        })
        setCatHappiness(happiness)
      }

      setLoading(false)
    } catch (error) {
      console.error('Error loading dashboard:', error)
      setLoading(false)
    }
  }

  async function handleRefresh() {
    setLoading(true)
    await loadDashboardData()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  const isSolo = !userProfile?.partner_id

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 mb-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                Welcome back, {userProfile?.name || 'Learner'}! 👋
              </h1>
              <p className="text-gray-600">
                Learning: <span className="font-semibold capitalize text-purple-600">
                  {userProfile?.target_language}
                </span>
                {isSolo && <span className="ml-2 text-sm text-gray-500">(Solo Mode)</span>}
              </p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg transition disabled:opacity-50 flex items-center gap-2"
            >
              🔄 Refresh
            </button>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Today</p>
              <p className="text-2xl font-bold text-blue-600">
                {userStats.wordsStudiedToday} words
              </p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Streak</p>
              <p className="text-2xl font-bold text-green-600">
                {userStats.currentStreak} days 🔥
              </p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Total Learned</p>
              <p className="text-2xl font-bold text-purple-600">
                {userStats.totalWordsLearned}
              </p>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Best Streak</p>
              <p className="text-2xl font-bold text-orange-600">
                {userStats.longestStreak} days
              </p>
            </div>
          </div>
        </div>

        {/* Cat Section */}
        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            {isSolo ? 'Your Cat 🐱' : 'Your Shared Cat 🐱'}
          </h2>
          
          <div className="flex flex-col md:flex-row items-center gap-8">
            {/* Cat Animation */}
            <div className="flex-shrink-0">
              <VocabCat happiness={catHappiness} />
            </div>

            {/* Cat Info */}
            <div className="flex-1 w-full">
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-600">Happiness</span>
                  <span className="text-lg font-bold text-purple-600">{catHappiness}/100</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      catHappiness >= 75
                        ? 'bg-gradient-to-r from-green-400 to-green-500'
                        : catHappiness >= 50
                        ? 'bg-gradient-to-r from-yellow-400 to-yellow-500'
                        : catHappiness >= 25
                        ? 'bg-gradient-to-r from-orange-400 to-orange-500'
                        : 'bg-gradient-to-r from-red-400 to-red-500'
                    }`}
                    style={{ width: `${catHappiness}%` }}
                  />
                </div>
              </div>
              
              <p className="text-gray-600 mb-4">
                {getCatMoodDescription(catHappiness, isSolo)}
              </p>

              {!isSolo && partnerProfile && (
                <div className="bg-purple-50 rounded-lg p-4">
                  <p className="text-sm font-medium text-purple-800 mb-2">
                    👥 Learning with {partnerProfile.name || 'Partner'}
                  </p>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-gray-600">Your progress today</p>
                      <p className="font-semibold text-purple-600">
                        {userStats.wordsStudiedToday} words
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Partner's progress</p>
                      <p className="font-semibold text-pink-600">
                        {partnerStats.wordsStudiedToday} words
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Current Cycle */}
        {cycleInfo.cycle && (
          <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Current Cycle #{cycleInfo.cycle.cycle_number}
            </h2>
            
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <p className="text-sm text-gray-600">Time Remaining</p>
                  <p className="text-3xl font-bold text-purple-700">
                    {cycleInfo.cycle.days_remaining} {cycleInfo.cycle.days_remaining === 1 ? 'day' : 'days'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Words in Cycle</p>
                  <p className="text-3xl font-bold text-blue-700">5 words</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Your Progress</p>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all"
                        style={{ width: `${(cycleInfo.userProgress / 5) * 100}%` }}
                      />
                    </div>
                    <span className="font-bold text-blue-600">
                      {cycleInfo.userProgress}/5
                    </span>
                  </div>
                </div>

                {!isSolo && (
                  <div className="bg-white rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">Partner's Progress</p>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-purple-500 h-2 rounded-full transition-all"
                          style={{ width: `${(cycleInfo.partnerProgress / 5) * 100}%` }}
                        />
                      </div>
                      <span className="font-bold text-purple-600">
                        {cycleInfo.partnerProgress}/5
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Partner Status or Solo Encouragement */}
        {isSolo ? (
          <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 mb-6">
            <div className="flex items-start gap-4">
              <div className="text-4xl">🚀</div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  Learning Solo
                </h3>
                <p className="text-gray-600 mb-4">
                  You're making great progress on your own! Want to make it more fun?
                </p>
                <button
                  onClick={() => router.push('/dashboard/partner')}
                  className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition"
                >
                  Invite a Partner →
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 mb-6">
            <div className="flex items-start gap-4">
              <div className="text-4xl">👥</div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  Partner: {partnerProfile?.name || 'Learning Buddy'}
                </h3>
                <p className="text-gray-600 mb-2">
                  Learning {partnerProfile?.target_language} • Streak: {partnerStats.currentStreak} days
                </p>
                <button
                  onClick={() => router.push('/dashboard/partner')}
                  className="text-purple-600 hover:underline text-sm font-medium"
                >
                  View Details →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => router.push('/dashboard/learn')}
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition transform hover:scale-105"
          >
            <div className="text-4xl mb-3">📚</div>
            <h3 className="text-2xl font-bold mb-2">Start Learning</h3>
            <p className="text-purple-100">
              {cycleInfo.userProgress === 5 
                ? 'Practice more words!' 
                : `${5 - cycleInfo.userProgress} words remaining`}
            </p>
          </button>

          <button
            onClick={() => router.push('/dashboard/progress')}
            className="bg-white border-2 border-purple-200 rounded-2xl p-8 shadow-lg hover:shadow-xl transition transform hover:scale-105"
          >
            <div className="text-4xl mb-3">📊</div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">View Progress</h3>
            <p className="text-gray-600">
              See your learning history
            </p>
          </button>
        </div>
      </div>
    </div>
  )
}