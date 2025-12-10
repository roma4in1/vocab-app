import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'VocabCat - Learn Together',
  description: 'Learn French and Korean vocabulary with your partner',
  manifest: '/manifest.json',
  themeColor: '#9333ea',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'VocabCat',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: 'website',
    siteName: 'VocabCat',
    title: 'VocabCat - Learn Together',
    description: 'Learn French and Korean vocabulary with your partner',
  },
  twitter: {
    card: 'summary',
    title: 'VocabCat - Learn Together',
    description: 'Learn French and Korean vocabulary with your partner',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body>{children}</body>
    </html>
  )
}