"use client"

import { AnimatePresence, motion } from "framer-motion"
import { X } from "lucide-react"
import type { Template } from "@/lib/types/database"

export function TemplatePreviewModal({
  template,
  onClose,
}: {
  template: Template | null
  onClose: () => void
}) {
  return (
    <AnimatePresence>
      {template && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden
          />
          <motion.div
            role="dialog"
            aria-modal
            aria-labelledby="template-preview-title"
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            className="fixed left-1/2 top-1/2 z-[81] max-h-[85vh] w-[min(640px,92vw)] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border border-violet-500/30 bg-[var(--flow-page-bg)] shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-flow-glass px-5 py-4">
              <div>
                <h2 id="template-preview-title" className="font-semibold text-flow">
                  {template.name}
                </h2>
                <p className="text-sm text-flow-muted">{template.subject}</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-2 text-flow-muted hover:bg-flow-glass-subtle hover:text-flow"
                aria-label="Close preview"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div
              className="max-h-[60vh] overflow-auto p-5 text-sm text-flow-secondary"
              dangerouslySetInnerHTML={{
                __html: template.body_html || "<p>No HTML body</p>",
              }}
            />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
