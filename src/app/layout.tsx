import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Nintendo Museum Calendar Fetcher',
  description: 'Fetches Nintendo Museum calendar data every 30 minutes',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
