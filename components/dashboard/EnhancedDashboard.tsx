// components/dashboard/EnhancedDashboard.tsx
// Enhanced dashboard with charts, partner comparison, and weekly summaries

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface DashboardProps {
  userId: string
  partnerId: string | null
  userLanguage: 'french' | 'korean'
  partnerLanguage: 'french' | 'korean'
}

interface ProgressData {
  wordsLearned: number
  wordsReviewed: number
  currentStreak: number
  longestStreak: number
  accuracy: number
  lastActive: string
}

interface DailyProgress {
  date: string
  wordsLearned: number
  wordsReviewed: number
}

export default function EnhancedDashboard({
  userId,
  partnerId,
  userLanguage,
  partnerLanguage
}: DashboardProps) {
  const [userProgress, setUserProgress] = useState<ProgressData | null>(null)
  const [partnerProgress, setPartnerProgress] = useState<ProgressData | null>(null)
  const [weeklyData, setWeeklyData] = useState<DailyProgress[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [userId, partnerId])

  const loadDashboardData = async () => {
    // TODO: Replace with actual Supabase queries
    // This is placeholder data structure
    
    const mockUserProgress: ProgressData = {
      wordsLearned: 42,
      wordsReviewed: 156,
      currentStreak: 7,
      longestStreak: 14,
      accuracy: 87,
      lastActive: new Date().toISOString()
    }

    const mockPartnerProgress: ProgressData = {
      wordsLearned: 38,
      wordsReviewed: 143,
      currentStreak: 6,
      longestStreak: 12,
      accuracy: 82,
      lastActive: new Date().toISOString()
    }

    const mockWeeklyData: DailyProgress[] = [
      { date: '2024-12-04', wordsLearned: 5, wordsReviewed: 12 },
      { date: '2024-12-05', wordsLearned: 7, wordsReviewed: 15 },
      { date: '2024-12-06', wordsLearned: 6, wordsReviewed: 18 },
      { date: '2024-12-07', wordsLearned: 8, wordsReviewed: 22 },
      { date: '2024-12-08', wordsLearned: 5, wordsReviewed: 19 },
      { date: '2024-12-09', wordsLearned: 6, wordsReviewed: 25 },
      { date: '2024-12-10', wordsLearned: 5, wordsReviewed: 20 }
    ]

    setUserProgress(mockUserProgress)
    setPartnerProgress(mockPartnerProgress)
    setWeeklyData(mockWeeklyData)
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    )
  }

  const maxWords = Math.max(
    ...weeklyData.map(d => d.wordsLearned + d.wordsReviewed)
  )

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Your Learning Dashboard
        </h1>
        <p className="text-gray-600">
          Learning {userLanguage === 'french' ? '🇫🇷 French' : '🇰🇷 Korean'}
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon="📚"
          label="Words Learned"
          value={userProgress?.wordsLearned || 0}
          color="blue"
        />
        <StatCard
          icon="🔄"
          label="Reviews Done"
          value={userProgress?.wordsReviewed || 0}
          color="purple"
        />
        <StatCard
          icon="🔥"
          label="Current Streak"
          value={`${userProgress?.currentStreak || 0} days`}
          color="orange"
        />
        <StatCard
          icon="🎯"
          label="Accuracy"
          value={`${userProgress?.accuracy || 0}%`}
          color="green"
        />
      </div>

      {/* Partner Comparison */}
      {partnerId && partnerProgress && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
            <span>👥</span> Learning Together
          </h2>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Your Progress */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="font-medium text-gray-700">You</span>
                <span className="text-sm text-gray-600">
                  {userLanguage === 'french' ? '🇫🇷 French' : '🇰🇷 Korean'}
                </span>
              </div>
              {userProgress && (
              <ProgressBar
                label="Words Learned"
                value={userProgress.wordsLearned}
                max={50}
                color="blue"
              />
              )}
              {userProgress && (
              <ProgressBar
                label="Accuracy"
                value={userProgress.accuracy}
                max={100}
                color="green"
                suffix="%"
              />
              )}
              {userProgress && (
              <ProgressBar
                label="Streak"
                value={userProgress.currentStreak}
                max={30}
                color="orange"
                suffix=" days"
              />
              )}
            </div>

            {/* Partner's Progress */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="font-medium text-gray-700">Partner</span>
                <span className="text-sm text-gray-600">
                  {partnerLanguage === 'french' ? '🇫🇷 French' : '🇰🇷 Korean'}
                </span>
              </div>
              <ProgressBar
                label="Words Learned"
                value={partnerProgress.wordsLearned}
                max={50}
                color="blue"
              />
              <ProgressBar
                label="Accuracy"
                value={partnerProgress.accuracy}
                max={100}
                color="green"
                suffix="%"
              />
              <ProgressBar
                label="Streak"
                value={partnerProgress.currentStreak}
                max={30}
                color="orange"
                suffix=" days"
              />
            </div>
          </div>
        </div>
      )}

      {/* Weekly Activity Chart */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">
          This Week's Activity
        </h2>

        <div className="space-y-4">
          {weeklyData.map((day, index) => {
            const total = day.wordsLearned + day.wordsReviewed
            const date = new Date(day.date)
            const dayName = date.toLocaleDateString('en-US', { weekday: 'short' })

            return (
              <div key={index} className="flex items-center gap-4">
                <div className="w-12 text-sm text-gray-600 font-medium">
                  {dayName}
                </div>
                <div className="flex-1 flex gap-1 h-8 bg-gray-100 rounded overflow-hidden">
                  {/* Learned portion */}
                  <div
                    className="bg-blue-500 transition-all duration-300"
                    style={{
                      width: `${(day.wordsLearned / maxWords) * 100}%`
                    }}
                  />
                  {/* Reviewed portion */}
                  <div
                    className="bg-purple-500 transition-all duration-300"
                    style={{
                      width: `${(day.wordsReviewed / maxWords) * 100}%`
                    }}
                  />
                </div>
                <div className="w-16 text-right text-sm font-medium text-gray-700">
                  {total} words
                </div>
              </div>
            )
          })}
        </div>

        <div className="flex gap-6 mt-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded" />
            <span className="text-gray-600">New words</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-purple-500 rounded" />
            <span className="text-gray-600">Reviews</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid md:grid-cols-2 gap-4">
        <Link
          href="/learn"
          className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-4 rounded-lg font-semibold text-center transition-colors"
        >
          Start Learning 📚
        </Link>
        <Link
          href="/review"
          className="bg-purple-500 hover:bg-purple-600 text-white px-8 py-4 rounded-lg font-semibold text-center transition-colors"
        >
          Review Words 🔄
        </Link>
      </div>
    </div>
  )
}

// Helper Components
function StatCard({ icon, label, value, color }: {
  icon: string
  label: string
  value: string | number
  color: 'blue' | 'purple' | 'orange' | 'green'
}) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
    green: 'bg-green-50 text-green-600'
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <div className="text-2xl mb-2">{icon}</div>
      <div className={`text-2xl font-bold ${colorClasses[color]}`}>
        {value}
      </div>
      <div className="text-sm text-gray-600 mt-1">{label}</div>
    </div>
  )
}

function ProgressBar({ label, value, max, color, suffix = '' }: {
  label: string
  value: number
  max: number
  color: 'blue' | 'green' | 'orange'
  suffix?: string
}) {
  const percentage = Math.min((value / max) * 100, 100)
  
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    orange: 'bg-orange-500'
  }

  return (
    <div className="mb-4">
      <div className="flex justify-between text-sm mb-2">
        <span className="text-gray-600">{label}</span>
        <span className="font-medium text-gray-800">
          {value}{suffix}
        </span>
      </div>
      <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full ${colorClasses[color]} transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}