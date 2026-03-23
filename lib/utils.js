import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merge Tailwind CSS classes without style conflicts.
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

/**
 * Format a date string as "Mar 22, 2026".
 */
export function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

/**
 * Format a date string as "Mar 22".
 */
export function formatShortDate(dateString) {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

/**
 * Return the number of whole days between today and a future date.
 * Negative if the date is in the past.
 */
export function daysUntil(dateString) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(dateString)
  target.setHours(0, 0, 0, 0)
  return Math.round((target - today) / (1000 * 60 * 60 * 24))
}

/**
 * Format a time string "HH:MM:SS" as "3:30 PM".
 */
export function formatTime(timeStr) {
  if (!timeStr) return null
  const [h, m] = timeStr.split(':')
  const hour = parseInt(h, 10)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const h12 = hour % 12 || 12
  return `${h12}:${m} ${ampm}`
}

/**
 * Convert "HH:MM:SS" to total minutes since midnight.
 */
export function timeToMinutes(timeStr) {
  if (!timeStr) return 0
  const [h, m] = timeStr.split(':').map(Number)
  return h * 60 + m
}

/**
 * Convert total minutes since midnight to "3:30 PM".
 */
export function minutesToTime(totalMinutes) {
  const h = Math.floor(totalMinutes / 60) % 24
  const m = totalMinutes % 60
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  return `${h12}:${m.toString().padStart(2, '0')} ${ampm}`
}

/**
 * Convert a string to a URL-safe slug.
 * e.g. "Hello World!" → "hello-world"
 */
export function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Returns true if the string looks like a valid email address.
 */
export const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

/**
 * Generate a plain-text running order from an array of performers
 * (sorted by slot_order). Each line: "N. Name (X mins)"
 */
export function formatRunningOrder(performers) {
  if (!performers?.length) return '(Running order not set)'
  return performers
    .filter((p) => p.name)
    .map((p, i) => {
      const line = `${i + 1}. ${p.name}`
      return p.set_length ? `${line} (${p.set_length} mins)` : line
    })
    .join('\n')
}

/**
 * Replace all [variable] placeholders in a comm template body with real show
 * data. [name] is intentionally left intact — it varies per recipient and
 * should be filled when actually sending.
 *
 * Supported variables: [date] [callTime] [doors] [showTime] [venue] [runningOrder]
 */
export function fillTemplate(body, showData) {
  if (!body) return ''
  const ro = formatRunningOrder(showData.performers ?? [])
  return body
    .replace(/\[date\]/g, showData.date ? formatDate(showData.date) : '[date]')
    .replace(/\[callTime\]/g, formatTime(showData.call_time) ?? '[callTime]')
    .replace(/\[doors\]/g, formatTime(showData.doors_time) ?? '[doors]')
    .replace(/\[showTime\]/g, formatTime(showData.show_time) ?? '[showTime]')
    .replace(/\[venue\]/g, showData.venue ?? showData.series?.venue ?? '[venue]')
    .replace(/\[runningOrder\]/g, ro)
}
