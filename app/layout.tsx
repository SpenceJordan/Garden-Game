import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'My Little Garden & Shelter 🌱',
  description: 'A cozy garden and animal shelter game',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600&family=DM+Sans:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
