"use client"

import { useEffect, useRef, useState } from "react"

/**
 * Reveals `source` on a Grok-like cadence instead of dumping whole SSE chunks.
 * When `active` is false, the full string is shown immediately.
 */
export function useSmoothedStream(source: string, active: boolean): string {
  const [shown, setShown] = useState(source)
  const shownRef = useRef(source)

  useEffect(() => {
    if (!active) {
      shownRef.current = source
      setShown(source)
      return
    }

    let raf = 0
    const tick = () => {
      const current = shownRef.current
      if (current === source) return
      if (source.startsWith(current)) {
        const behind = source.length - current.length
        if (behind <= 0) return
        const step =
          behind > 400 ? Math.ceil(behind / 8) : behind > 80 ? 6 : behind > 24 ? 3 : 2
        const next = source.slice(0, current.length + step)
        shownRef.current = next
        setShown(next)
        if (next !== source) raf = requestAnimationFrame(tick)
        return
      }
      shownRef.current = source
      setShown(source)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [source, active])

  return shown
}
