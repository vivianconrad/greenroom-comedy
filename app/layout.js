import { Fraunces, DM_Sans } from 'next/font/google'
import { config } from '@fortawesome/fontawesome-svg-core'
import '@fortawesome/fontawesome-svg-core/styles.css'
import './globals.css'

// Prevent Font Awesome from injecting its own <style> tags at runtime —
// we import the CSS statically above instead (required for Next.js SSR).
config.autoAddCss = false

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  display: 'swap',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
})

export const metadata = {
  title: 'Greenroom',
  description: 'Produce comedy shows without losing your mind',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${dmSans.variable}`}>
      <body className="font-body bg-cream min-h-screen" suppressHydrationWarning>{children}</body>
    </html>
  )
}
