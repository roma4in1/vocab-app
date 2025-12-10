'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser, getUserProfile } from '@/lib/auth'
import { getCycleInfo, CycleInfo } from '@/lib/cycles'
import { supabase } from '@/lib/supabase'
import { User } from '@/types/database'
import VocabCat from '@/components/VocabCat'

export default function DashboardPage() {
  const router = useRouter()
  const [userProfile, setUserProfile] = useState<User | null>(null)
  const [partnerProfile, setPartnerProfile] = useState<User | null>(null)
  const [cycleInfo, setCycleInfo] = useState<{
    cycle: CycleInfo | null
    userProgress: number
    partnerProgress: number
  }>({ cycle: null, userProgress: 0, partnerProgress: 0 })
  const [userStats, setUserStats] = useState({ wordsReviewed: 0, streak: 0 })
  const [partnerStats, setPartnerStats] = useState({ wordsReviewed: 0, streak: 0 })
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

      // Load cycle info
      if (profile.partner_id) {
        const cycleData = await getCycleInfo(user.id)
        console.log('Cycle data:', cycleData)
        setCycleInfo(cycleData)
      }

      // Load partner profile
      if (profile.partner_id) {
        const partner = await getUserProfile(profile.partner_id)
        setPartnerProfile(partner)

        // Load cat happiness
        const coupleId = [profile.id, profile.partner_id].sort().join('_')
        const { data: catData } = await supabase
          .from('cat_state')
          .select('happiness_level')
          .eq('couple_id', coupleId)
          .single()

        if (catData) {
          setCatHappiness(catData.happiness_level)
        }

        // Load partner stats
        const { data: partnerSessions } = await supabase
          .from('review_sessions')
          .select('*')
          .eq('user_id', profile.partner_id)

        setPartnerStats({
          wordsReviewed: partnerSessions?.length || 0,
          streak: 0
        })
      }

      // Load user stats
      const { data: userSessions } = await supabase
        .from('review_sessions')
        .select('*')
        .eq('user_id', user.id)

      setUserStats({
        wordsReviewed: userSessions?.length || 0,
        streak: 0
      })

      setLoading(false)
    } catch (error) {
      console.error('Error loading dashboard:', error)
      setLoading(false)
    }
  }

  // ✨ Add refresh function
  async function handleRefresh() {
    setLoading(true)
    await loadDashboardData()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="bg-white rounded-2xl shadow-lg p-8">
        {/* ✨ Header with Refresh Button */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold">
              Welcome back, {userProfile?.name}! 👋
            </h2>
            <p className="text-gray-600">
              You're learning: <span className="font-semibold capitalize">{userProfile?.target_language}</span>
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg transition disabled:opacity-50"
          >
            🔄 Refresh
          </button>
        </div>
        
        {/* Cycle Info */}
        {cycleInfo.cycle && (
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 mb-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-600">Current Cycle</p>
                <p className="text-2xl font-bold text-purple-700">
                  Cycle #{cycleInfo.cycle.cycle_number}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Time Remaining</p>
                <p className="text-2xl font-bold text-blue-700">
                  {cycleInfo.cycle.days_remaining} {cycleInfo.cycle.days_remaining === 1 ? 'day' : 'days'}
                </p>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="bg-white rounded-lg p-3">
                <p className="text-xs text-gray-600">Your Progress</p>
                <p className="text-lg font-bold text-blue-600">
                  {cycleInfo.userProgress}/5 words
                </p>
              </div>
              <div className="bg-white rounded-lg p-3">
                <p className="text-xs text-gray-600">Partner's Progress</p>
                <p className="text-lg font-bold text-purple-600">
                  {cycleInfo.partnerProgress}/5 words
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Partner Status */}
        {!userProfile?.partner_id ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-yellow-800 mb-2">
              👥 You haven't connected with a partner yet!
            </p>
            <button
              onClick={() => router.push('/dashboard/partner')}
              className="text-yellow-700 font-medium hover:underline"
            >
              Connect now →
            </button>
          </div>
        ) : (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-800 font-medium">
                  👥 Learning with {partnerProfile?.name || 'Partner'}
                </p>
                <p className="text-sm text-purple-600">
                  They're learning {partnerProfile?.target_language}
                </p>
              </div>
              <button
                onClick={() => router.push('/dashboard/partner')}
                className="text-purple-700 text-sm hover:underline"
              >
                View →
              </button>
            </div>
          </div>
        )}

        {/* ✨ ANIMATED CAT - Replace the old cat emoji section with this! */}
        {userProfile?.partner_id && (
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
            <VocabCat happiness={catHappiness} />
          </div>
        )}

        {/* Start Learning Button */}
        <button
          onClick={() => router.push('/dashboard/learn')}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-6 rounded-2xl font-bold text-xl hover:from-purple-700 hover:to-pink-700 transition shadow-lg hover:shadow-xl mb-6"
        >
          🚀 Start Learning
        </button>

        {/* Stats Comparison */}
        <div className="grid grid-cols-2 gap-4">
          {/* Your Stats */}
          <div className="bg-blue-50 rounded-xl p-4">
            <p className="text-sm font-medium text-gray-600 mb-3">Your Progress</p>
            <div className="space-y-2">
              <div>
                <p className="text-2xl font-bold text-blue-600">{userStats.wordsReviewed}</p>
                <p className="text-xs text-gray-600">Words Reviewed</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">{userStats.streak}</p>
                <p className="text-xs text-gray-600">Day Streak</p>
              </div>
            </div>
          </div>

          {/* Partner Stats */}
          {partnerProfile ? (
            <div className="bg-purple-50 rounded-xl p-4">
              <p className="text-sm font-medium text-gray-600 mb-3">
                {partnerProfile.name}'s Progress
              </p>
              <div className="space-y-2">
                <div>
                  <p className="text-2xl font-bold text-purple-600">{partnerStats.wordsReviewed}</p>
                  <p className="text-xs text-gray-600">Words Reviewed</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-purple-600">{partnerStats.streak}</p>
                  <p className="text-xs text-gray-600">Day Streak</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-xl p-4 flex items-center justify-center">
              <p className="text-gray-400 text-sm">No partner yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}