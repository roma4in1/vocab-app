'use client'

import { useEffect, useState } from 'react'

export default function InstallPrompt() {
  const [installPrompt, setInstallPrompt] = useState<any>(null)
  const [showPrompt, setShowPrompt] = useState(false)

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return // Already installed
    }

    // Listen for install prompt
    const handler = (e: Event) => {
      e.preventDefault()
      setInstallPrompt(e)
      setShowPrompt(true)
    }

    window.addEventListener('beforeinstallprompt', handler)

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  async function handleInstall() {
    if (!installPrompt) return

    installPrompt.prompt()
    const { outcome } = await installPrompt.userChoice
    
    if (outcome === 'accepted') {
      setShowPrompt(false)
    }
  }

  function handleDismiss() {
    setShowPrompt(false)
  }

  if (!showPrompt) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-purple-600 text-white p-4 shadow-lg z-50">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
        <div className="flex-1">
          <p className="font-medium">Install VocabCat</p>
          <p className="text-sm text-purple-100">
            Add to your home screen for quick access
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleDismiss}
            className="px-4 py-2 text-sm text-purple-100 hover:text-white"
          >
            Not now
          </button>
          <button
            onClick={handleInstall}
            className="px-4 py-2 bg-white text-purple-600 rounded-lg font-medium text-sm hover:bg-purple-50"
          >
            Install
          </button>
        </div>
      </div>
    </div>
  )
}