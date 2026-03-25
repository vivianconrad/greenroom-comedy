import {
  cn,
  formatDate,
  formatShortDate,
  daysUntil,
  formatTime,
  timeToMinutes,
  minutesToTime,
  slugify,
  isValidEmail,
  formatRunningOrder,
  fillTemplate,
} from '../lib/utils'

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

describe('formatShortDate', () => {
  it('formats without year', () => {
    expect(formatShortDate('2026-03-22T12:00:00')).toBe('Mar 22')
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

describe('formatTime', () => {
  it('formats a morning time', () => {
    expect(formatTime('09:30:00')).toBe('9:30 AM')
  })

  it('formats noon', () => {
    expect(formatTime('12:00:00')).toBe('12:00 PM')
  })

  it('formats a PM time', () => {
    expect(formatTime('19:45:00')).toBe('7:45 PM')
  })

  it('formats midnight as 12 AM', () => {
    expect(formatTime('00:00:00')).toBe('12:00 AM')
  })

  it('returns null for a falsy value', () => {
    expect(formatTime(null)).toBeNull()
    expect(formatTime('')).toBeNull()
  })
})

describe('timeToMinutes', () => {
  it('converts a time string to minutes since midnight', () => {
    expect(timeToMinutes('01:30:00')).toBe(90)
  })

  it('returns 0 for a falsy value', () => {
    expect(timeToMinutes(null)).toBe(0)
    expect(timeToMinutes('')).toBe(0)
  })
})

describe('minutesToTime', () => {
  it('converts minutes to a formatted time string', () => {
    expect(minutesToTime(90)).toBe('1:30 AM')
  })

  it('handles PM times', () => {
    expect(minutesToTime(19 * 60 + 45)).toBe('7:45 PM')
  })

  it('handles midnight rollover', () => {
    expect(minutesToTime(24 * 60)).toBe('12:00 AM')
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

describe('isValidEmail', () => {
  it('accepts a valid email', () => {
    expect(isValidEmail('test@example.com')).toBe(true)
  })

  it('rejects an email without @', () => {
    expect(isValidEmail('notanemail')).toBe(false)
  })

  it('rejects an email without a domain', () => {
    expect(isValidEmail('test@')).toBe(false)
  })
})

describe('formatRunningOrder', () => {
  it('returns placeholder when empty', () => {
    expect(formatRunningOrder([])).toBe('(Running order not set)')
    expect(formatRunningOrder(null)).toBe('(Running order not set)')
  })

  it('formats performers without set length', () => {
    const performers = [{ name: 'Alice' }, { name: 'Bob' }]
    expect(formatRunningOrder(performers)).toBe('1. Alice\n2. Bob')
  })

  it('includes set length when present', () => {
    const performers = [{ name: 'Alice', set_length: 10 }]
    expect(formatRunningOrder(performers)).toBe('1. Alice (10 mins)')
  })

  it('skips performers without a name', () => {
    const performers = [{ name: 'Alice' }, { name: null }, { name: 'Bob' }]
    expect(formatRunningOrder(performers)).toBe('1. Alice\n2. Bob')
  })
})

describe('fillTemplate', () => {
  const showData = {
    date: '2026-03-22T12:00:00',
    call_time: '18:00:00',
    doors_time: '19:00:00',
    show_time: '20:00:00',
    venue: 'The Lincoln Lodge',
    performers: [{ name: 'Alice', set_length: 10 }],
  }

  it('replaces all supported variables', () => {
    const body = '[date] [callTime] [doors] [showTime] [venue] [runningOrder]'
    const result = fillTemplate(body, showData)
    expect(result).toContain('Mar 22, 2026')
    expect(result).toContain('6:00 PM')
    expect(result).toContain('7:00 PM')
    expect(result).toContain('8:00 PM')
    expect(result).toContain('The Lincoln Lodge')
    expect(result).toContain('1. Alice (10 mins)')
  })

  it('returns an empty string for a falsy body', () => {
    expect(fillTemplate(null, showData)).toBe('')
  })

  it('falls back to series venue when show venue is absent', () => {
    const data = { ...showData, venue: null, series: { venue: 'Fallback Venue' } }
    expect(fillTemplate('[venue]', data)).toBe('Fallback Venue')
  })

  it('replaces [theme] with the show theme', () => {
    const data = { ...showData, theme: 'Spooky Season' }
    expect(fillTemplate('[theme]', data)).toBe('Spooky Season')
  })

  it('leaves [theme] intact when theme is absent', () => {
    expect(fillTemplate('[theme]', showData)).toBe('[theme]')
  })

  it('leaves [name] intact', () => {
    expect(fillTemplate('Hi [name]', showData)).toBe('Hi [name]')
  })
})
