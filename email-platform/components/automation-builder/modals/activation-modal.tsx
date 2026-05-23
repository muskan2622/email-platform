"use client"

import { AnimatePresence, motion } from "framer-motion"
import { CheckCircle2, Loader2, Zap } from "lucide-react"
import { cn } from "@/lib/utils"

export function ActivationModal({
  open,
  loading,
  success,
  automationName,
  onConfirm,
  onClose,
  onOpenEditor,
}: {
  open: boolean
  loading: boolean
  success: boolean
  automationName: string
  onConfirm: () => void
  onClose: () => void
  onOpenEditor?: () => void
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] bg-black/70 backdrop-blur-md"
            onClick={!loading ? onClose : undefined}
          />
          <motion.div
            role="dialog"
            aria-modal
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed left-1/2 top-1/2 z-[91] w-[min(420px,92vw)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-violet-500/40 bg-gradient-to-b from-violet-950/90 to-[var(--flow-page-bg)] p-6 shadow-[0_0_60px_-12px_rgba(139,92,246,0.5)]"
          >
            {success ? (
              <div className="text-center">
                <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-400" />
                <h2 className="mt-4 text-lg font-semibold text-flow">Automation live</h2>
                <p className="mt-2 text-sm text-flow-muted">
                  <strong className="text-flow">{automationName}</strong> is now active. Open the
                  workflow editor to run tests and inspect execution.
                </p>
                {onOpenEditor ? (
                  <button
                    type="button"
                    onClick={onOpenEditor}
                    className="mt-6 w-full rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 py-2.5 text-sm font-medium text-white hover:opacity-90"
                  >
                    Open workflow editor
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={onClose}
                  className={cn(
                    "w-full rounded-xl border border-flow-glass py-2.5 text-sm text-flow-muted hover:text-flow",
                    onOpenEditor ? "mt-2" : "mt-6"
                  )}
                >
                  Done
                </button>
              </div>
            ) : (
              <>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/25">
                  <Zap className="h-6 w-6 text-violet-300" />
                </div>
                <h2 className="mt-4 text-lg font-semibold text-flow">Activate automation?</h2>
                <p className="mt-2 text-sm text-flow-muted">
                  <strong className="text-flow">{automationName}</strong> will start processing
                  matching events immediately.
                </p>
                <div className="mt-6 flex gap-3">
                  <button
                    type="button"
                    disabled={loading}
                    onClick={onClose}
                    className="flex-1 rounded-xl border border-flow-glass py-2.5 text-sm text-flow-muted hover:text-flow disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={onConfirm}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 py-2.5 text-sm font-medium text-white disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Activating…
                      </>
                    ) : (
                      "Activate"
                    )}
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
