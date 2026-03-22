import { useState } from 'react'

export function useCopyToClipboard(duration = 2000) {
  const [copied, setCopied] = useState(false)
  function copy(text) {
    if (!text) return
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), duration)
    })
  }
  return [copied, copy]
}
