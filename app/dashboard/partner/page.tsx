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
    
    // Find partner by email
    const { data: partner, error: findError } = await supabase
      .from('users')
      .select('*')
      .ilike('email', partnerEmail.trim())
      .single()

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

    setSuccess(`Connected with ${partner.name || partner.email}!`)
    setTimeout(() => {
      window.location.href = '/dashboard'
    }, 2000)
  } catch (error) {
    console.error('Error connecting:', error)
    setError('Failed to connect. Please try again.')
  } finally {
    setConnecting(false)
  }
}

  async function handleDisconnect() {
    if (!userProfile || !partnerProfile) return

    const confirmed = confirm('Are you sure you want to disconnect from your partner?')
    if (!confirmed) return

    setConnecting(true)

    try {
      // Remove connection (both ways)
      await supabase
        .from('users')
        .update({ partner_id: null })
        .eq('id', userProfile.id)

      await supabase
        .from('users')
        .update({ partner_id: null })
        .eq('id', partnerProfile.id)

      setSuccess('Disconnected successfully')
      setTimeout(() => {
        router.push('/dashboard')
      }, 1500)
    } catch (error) {
      console.error('Error disconnecting:', error)
      setError('Failed to disconnect')
    } finally {
      setConnecting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-8">
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <h2 className="text-3xl font-bold mb-6">Partner Connection</h2>

        {partnerProfile ? (
          // Already connected
          <div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
              <div className="flex items-center gap-4">
                <div className="text-4xl">👥</div>
                <div>
                  <p className="font-medium text-green-900">Connected with</p>
                  <p className="text-2xl font-bold text-green-700">
                    {partnerProfile.name || partnerProfile.email}
                  </p>
                  <p className="text-sm text-green-600">
                    Learning {partnerProfile.target_language}
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={handleDisconnect}
              disabled={connecting}
              className="w-full bg-red-100 text-red-700 py-3 rounded-lg font-medium hover:bg-red-200 disabled:opacity-50 transition"
            >
              {connecting ? 'Disconnecting...' : 'Disconnect'}
            </button>
          </div>
        ) : (
          // Not connected yet
          <div>
            <p className="text-gray-600 mb-6">
              Enter your partner's email address to connect and start learning together!
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Partner's Email
              </label>
              <input
                type="email"
                value={partnerEmail}
                onChange={(e) => setPartnerEmail(e.target.value)}
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="partner@email.com"
              />
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-4">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 text-green-600 p-4 rounded-lg mb-4">
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

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> Your partner needs to create an account first. 
                Both of you should use this feature to connect.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}