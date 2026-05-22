"use client"

import { memo, useEffect, useRef } from "react"

function SpotlightCursorBase() {
  const ref = useRef<HTMLDivElement | null>(null)
  const frame = useRef<number | null>(null)
  const point = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const move = (event: PointerEvent) => {
      point.current = { x: event.clientX, y: event.clientY }
      if (frame.current !== null) return

      frame.current = requestAnimationFrame(() => {
        frame.current = null
        const el = ref.current
        if (!el) return
        el.style.setProperty("--spotlight-x", `${point.current.x}px`)
        el.style.setProperty("--spotlight-y", `${point.current.y}px`)
      })
    }

    window.addEventListener("pointermove", move, { passive: true })
    return () => {
      window.removeEventListener("pointermove", move)
      if (frame.current !== null) cancelAnimationFrame(frame.current)
    }
  }, [])

  return <div ref={ref} className="pointer-events-none fixed inset-0 z-[1] flow-spotlight" aria-hidden />
}

export const SpotlightCursor = memo(SpotlightCursorBase)
