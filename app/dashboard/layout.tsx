'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser, signOut } from '@/lib/auth'
import InstallPrompt from '@/components/InstallPrompt'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkUser()
  }, [])

  async function checkUser() {
    const user = await getCurrentUser()
    if (!user) {
      router.push('/login')
    } else {
      setLoading(false)
    }
  }

  async function handleSignOut() {
    await signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-purple-600">🐱 VocabCat</h1>
          <button
            onClick={handleSignOut}
            className="text-gray-600 hover:text-gray-900"
          >
            Sign Out
          </button>
        </div>
      </nav>
      <main>{children}</main>
      <InstallPrompt />
    </div>
  )
}