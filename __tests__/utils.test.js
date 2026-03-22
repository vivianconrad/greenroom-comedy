import { cn, formatDate, daysUntil, slugify } from '../lib/utils'

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('deduplicates conflicting Tailwind classes', () => {
    expect(cn('p-4', 'p-8')).toBe('p-8')
  })
})

describe('formatDate', () => {
  it('formats a known date string', () => {
    // Use noon local time to avoid UTC-offset edge cases
    expect(formatDate('2026-03-22T12:00:00')).toBe('Mar 22, 2026')
  })
})

describe('daysUntil', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2026-03-22'))
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('returns positive days for a future date', () => {
    expect(daysUntil('2026-03-29')).toBe(7)
  })

  it('returns negative days for a past date', () => {
    expect(daysUntil('2026-03-15')).toBe(-7)
  })

  it('returns 0 for today', () => {
    expect(daysUntil('2026-03-22')).toBe(0)
  })
})

describe('slugify', () => {
  it('lowercases and hyphenates words', () => {
    expect(slugify('Hello World')).toBe('hello-world')
  })

  it('strips special characters', () => {
    expect(slugify('Hello World!')).toBe('hello-world')
  })

  it('collapses multiple spaces', () => {
    expect(slugify('too   many   spaces')).toBe('too-many-spaces')
  })

  it('trims leading and trailing hyphens', () => {
    expect(slugify('  trimmed  ')).toBe('trimmed')
  })
})
