"use client"

import { ArrowLeft, ArrowRight, Redo2, Save, Undo2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type WizardNavProps = {
  onBack?: () => void
  onNext?: () => void
  onSaveDraft?: () => void
  onUndo?: () => void
  onRedo?: () => void
  canBack?: boolean
  canNext?: boolean
  nextLabel?: string
  saving?: boolean
  showSaveDraft?: boolean
  canUndo?: boolean
  canRedo?: boolean
}

export function WizardNav({
  onBack,
  onNext,
  onSaveDraft,
  onUndo,
  onRedo,
  canBack = true,
  canNext = true,
  nextLabel = "Continue",
  saving = false,
  showSaveDraft = true,
  canUndo = false,
  canRedo = false,
}: WizardNavProps) {
  return (
    <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-flow-glass pt-6">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onUndo}
          disabled={!canUndo}
          className="border-flow-glass bg-flow-glass-subtle text-flow-muted"
          aria-label="Undo"
        >
          <Undo2 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onRedo}
          disabled={!canRedo}
          className="border-flow-glass bg-flow-glass-subtle text-flow-muted"
          aria-label="Redo"
        >
          <Redo2 className="h-4 w-4" />
        </Button>
        {showSaveDraft && onSaveDraft && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onSaveDraft}
            disabled={saving}
            className="text-flow-muted"
          >
            <Save className="mr-1.5 h-4 w-4" />
            Save draft
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2">
        {canBack && onBack && (
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            className="border-flow-glass bg-flow-glass-subtle"
          >
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Back
          </Button>
        )}
        {onNext && (
          <button
            type="button"
            onClick={onNext}
            disabled={!canNext || saving}
            className={cn(
              "inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium text-white",
              "bg-gradient-to-r from-violet-600 via-indigo-500 to-cyan-500",
              "shadow-[0_0_30px_-10px_rgba(99,102,241,0.58)] transition-all",
              "hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0"
            )}
          >
            {nextLabel}
            <ArrowRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </footer>
  )
}
