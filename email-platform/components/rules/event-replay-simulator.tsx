"use client"

import { Code2, Loader2, Play, RefreshCw, Sparkles } from "lucide-react"
import { useCallback, useEffect, useMemo, useState } from "react"
import { GlassCard } from "@/components/motion/glass-card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { EventTypeRow } from "@/lib/platform/types"
import type { IncomingEvent } from "@/lib/types/database"
import { buildSamplePayload, validatePayloadJson } from "@/lib/workflow/sample-payload"

export function EventReplaySimulator({
  eventType,
  eventTypes,
  onReplay,
  running,
  lastIdempotencyKey,
}: {
  eventType: string
  eventTypes: EventTypeRow[]
  onReplay: (event: IncomingEvent) => Promise<void>
  running: boolean
  lastIdempotencyKey?: string | null
}) {
  const catalogEntry = useMemo(
    () => eventTypes.find((e) => e.event === eventType) ?? null,
    [eventTypes, eventType]
  )

  const [payloadText, setPayloadText] = useState("")
  const [validationError, setValidationError] = useState<string | null>(null)

  const resetPayload = useCallback(() => {
    const sample = buildSamplePayload(eventType, catalogEntry)
    setPayloadText(JSON.stringify(sample, null, 2))
    setValidationError(null)
  }, [eventType, catalogEntry])

  useEffect(() => {
    resetPayload()
  }, [resetPayload])

  const handlePreset = (preset: EventTypeRow) => {
    const sample = buildSamplePayload(preset.event, preset)
    setPayloadText(JSON.stringify(sample, null, 2))
    setValidationError(null)
  }

  const handleValidate = () => {
    const result = validatePayloadJson(payloadText)
    if (!result.ok) {
      setValidationError(result.error)
      return
    }
    setValidationError(null)
  }

  const handleReplay = async () => {
    const result = validatePayloadJson(payloadText)
    if (!result.ok) {
      setValidationError(result.error)
      return
    }
    setValidationError(null)
    await onReplay(result.value)
  }

  return (
    <GlassCard className="p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Code2 className="h-4 w-4 text-cyan-300" />
          <h2 className="text-sm font-semibold text-flow">Event Replay Simulator</h2>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={resetPayload} title="Reset payload">
          <RefreshCw className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="mb-2 flex flex-wrap gap-1">
        {eventTypes.slice(0, 8).map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => handlePreset(preset)}
            className={cn(
              "rounded-md border px-2 py-1 font-mono text-[10px] transition",
              preset.event === eventType
                ? "border-cyan-300/40 bg-cyan-300/10 text-cyan-100"
                : "border-flow-glass-faint bg-flow-glass-subtle text-flow-muted hover:text-flow"
            )}
          >
            {preset.event}
          </button>
        ))}
      </div>

      <textarea
        value={payloadText}
        onChange={(e) => setPayloadText(e.target.value)}
        spellCheck={false}
        className="max-h-[220px] min-h-[180px] w-full resize-y rounded-lg border border-flow-glass-faint bg-black/35 p-3 font-mono text-[11px] leading-relaxed text-cyan-100/90 focus:border-cyan-300/40 focus:outline-none"
      />

      {validationError ? (
        <p className="mt-2 text-xs text-rose-300">{validationError}</p>
      ) : (
        <p className="mt-2 text-[10px] text-flow-faint">Editable JSON · validates on replay</p>
      )}

      <div className="mt-3 flex gap-2">
        <Button variant="outline" size="sm" className="flex-1" onClick={handleValidate}>
          Validate
        </Button>
        <Button size="sm" className="flex-1" onClick={() => void handleReplay()} disabled={running}>
          {running ? <Loader2 className="animate-spin" /> : <Play />}
          Replay
        </Button>
      </div>

      <Button
        variant="ghost"
        size="sm"
        className="mt-2 w-full text-xs"
        onClick={resetPayload}
      >
        <Sparkles className="h-3 w-3" />
        Generate sample payload
      </Button>

      {lastIdempotencyKey ? (
        <div className="mt-3 rounded-lg border border-flow-glass-faint bg-flow-glass-subtle p-3">
          <p className="text-[11px] uppercase tracking-wide text-flow-faint">Last replay</p>
          <p className="mt-1 truncate font-mono text-xs text-cyan-200">{lastIdempotencyKey}</p>
        </div>
      ) : null}
    </GlassCard>
  )
}
