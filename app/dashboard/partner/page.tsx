// app/dashboard/partner/page.tsx
// ✅ FIXED: Partner connection page with disconnect feature and better UX

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser, getUserProfile } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { User } from '@/types/database'

export default function PartnerPage() {
  const router = useRouter()
  const [userProfile, setUserProfile] = useState<User | null>(null)
  const [partnerEmail, setPartnerEmail] = useState('')
  const [partnerProfile, setPartnerProfile] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    loadUserAndPartner()
  }, [])

  async function loadUserAndPartner() {
    try {
      const user = await getCurrentUser()
      if (!user) {
        router.push('/login')
        return
      }

      const profile = await getUserProfile(user.id)
      setUserProfile(profile)

      // Load partner if exists
      if (profile.partner_id) {
        const partner = await getUserProfile(profile.partner_id)
        setPartnerProfile(partner)
      }

      setLoading(false)
    } catch (error) {
      console.error('Error loading user:', error)
      setLoading(false)
    }
  }

  async function handleConnect() {
    if (!partnerEmail || !userProfile) return

    setConnecting(true)
    setError('')
    setSuccess('')

    try {
      console.log('Searching for partner with email:', partnerEmail)
      
      // Find partner by email (case-insensitive)
      const { data: partner, error: findError } = await supabase
        .from('users')
        .select('*')
        .ilike('email', partnerEmail.trim())
        .maybeSingle()

      console.log('Partner search result:', partner)

      if (findError || !partner) {
        console.error('Partner not found:', findError)
        setError('Partner not found. Make sure they have created an account.')
        setConnecting(false)
        return
      }

      if (partner.id === userProfile.id) {
        setError('You cannot connect with yourself!')
        setConnecting(false)
        return
      }

      // Check if partner is already connected to someone else
      if (partner.partner_id && partner.partner_id !== userProfile.id) {
        setError(`${partner.name || partner.email} is already connected with another partner.`)
        setConnecting(false)
        return
      }

      // Use the database function to connect partners
      const { data, error: connectError } = await supabase
        .rpc('connect_partners', {
          user1_id: userProfile.id,
          user2_id: partner.id
        })

      if (connectError) {
        console.error('Connection error:', connectError)
        setError(connectError.message || 'Failed to connect')
        setConnecting(false)
        return
      }

      if (data && !data.success) {
        setError(data.error || 'Failed to connect')
        setConnecting(false)
        return
      }

      setSuccess(`Successfully connected with ${partner.name || partner.email}!`)
      
      // Reload the page to show updated partner info
      setTimeout(() => {
        window.location.reload()
      }, 1500)
    } catch (error) {
      console.error('Error connecting:', error)
      setError('Failed to connect. Please try again.')
      setConnecting(false)
    }
  }

  async function handleDisconnect() {
    if (!userProfile || !userProfile.partner_id) return

    if (!confirm('Are you sure you want to disconnect from your partner? Your learning progress will be preserved, but you\'ll return to solo mode.')) {
      return
    }

    setDisconnecting(true)
    setError('')
    setSuccess('')

    try {
      const { data, error: disconnectError } = await supabase
        .rpc('disconnect_partners', {
          requesting_user_id: userProfile.id
        })

      if (disconnectError) {
        console.error('Disconnect error:', disconnectError)
        setError(disconnectError.message || 'Failed to disconnect')
        setDisconnecting(false)
        return
      }

      if (data && !data.success) {
        setError(data.error || 'Failed to disconnect')
        setDisconnecting(false)
        return
      }

      setSuccess('Successfully disconnected. Returning to solo mode...')
      
      // Reload after a delay
      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)
    } catch (error) {
      console.error('Error disconnecting:', error)
      setError('Failed to disconnect. Please try again.')
      setDisconnecting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/dashboard')}
            className="text-purple-600 hover:text-purple-700 mb-4 flex items-center gap-2"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-800">Partner Settings</h1>
          <p className="text-gray-600 mt-2">
            {partnerProfile ? 'Manage your learning partnership' : 'Connect with a learning partner'}
          </p>
        </div>

        {/* Current Partner Status */}
        {partnerProfile ? (
          <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 mb-6">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                {partnerProfile.name?.[0]?.toUpperCase() || '👤'}
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-800 mb-1">
                  {partnerProfile.name || 'Learning Partner'}
                </h2>
                <p className="text-gray-600">{partnerProfile.email}</p>
                <p className="text-sm text-purple-600 mt-1">
                  Learning: {partnerProfile.target_language}
                </p>
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2 text-green-800">
                <span className="text-xl">✅</span>
                <span className="font-medium">Connected</span>
              </div>
              <p className="text-sm text-green-700 mt-1">
                You're learning together! Your cat's happiness depends on both of your progress.
              </p>
            </div>

            <button
              onClick={handleDisconnect}
              disabled={disconnecting}
              className="w-full bg-red-50 text-red-600 py-3 rounded-lg font-medium hover:bg-red-100 disabled:opacity-50 transition"
            >
              {disconnecting ? 'Disconnecting...' : 'Disconnect Partner'}
            </button>
          </div>
        ) : (
          /* Connect with Partner Form */
          <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Connect with a Partner
              </h2>
              <p className="text-gray-600">
                Learning together makes it more fun! Share progress and keep each other motivated.
              </p>
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
                <span className="text-2xl">👥</span>
                <div>
                  <p className="font-medium text-gray-800">Shared Progress</p>
                  <p className="text-sm text-gray-600">Both partners work through the same vocabulary cycles</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-purple-50 rounded-lg">
                <span className="text-2xl">🐱</span>
                <div>
                  <p className="font-medium text-gray-800">Shared Cat</p>
                  <p className="text-sm text-gray-600">Your cat's happiness reflects both partners' efforts</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-pink-50 rounded-lg">
                <span className="text-2xl">🔥</span>
                <div>
                  <p className="font-medium text-gray-800">Shared Streaks</p>
                  <p className="text-sm text-gray-600">Maintain streaks together and stay accountable</p>
                </div>
              </div>
            </div>

            {/* Connection Form */}
            <div className="border-t pt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Partner's Email Address
              </label>
              <input
                type="email"
                value={partnerEmail}
                onChange={(e) => setPartnerEmail(e.target.value)}
                placeholder="partner@example.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent mb-4"
                disabled={connecting}
              />

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                  {error}
                </div>
              )}

              {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">
                  {success}
                </div>
              )}

              <button
                onClick={handleConnect}
                disabled={connecting || !partnerEmail}
                className="w-full bg-purple-600 text-white py-3 rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {connecting ? 'Connecting...' : 'Connect with Partner'}
              </button>

              <p className="text-sm text-gray-500 mt-4 text-center">
                Your partner must have an account first. They can sign up at the same link you used.
              </p>
            </div>
          </div>
        )}

        {/* Solo Mode Info */}
        {!partnerProfile && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mt-6">
            <h3 className="font-bold text-blue-900 mb-2">✨ Solo Mode is Great Too!</h3>
            <p className="text-blue-800 text-sm">
              You can learn perfectly fine on your own. Partner mode is optional and you can add a partner anytime later.
              Your learning progress is saved either way!
            </p>
          </div>
        )}
      </div>
    </div>
  )
}