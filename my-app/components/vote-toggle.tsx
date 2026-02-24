"use client"

import React from "react"

import { cn } from "@/lib/utils"
import type { VoteValue } from "@/lib/types"
import { Check, X, HelpCircle } from "lucide-react"

interface VoteToggleProps {
  value: VoteValue | null
  onChange: (value: VoteValue) => void
  disabled?: boolean
}

export function VoteToggle({ value, onChange, disabled }: VoteToggleProps) {
  const options: { value: VoteValue; icon: React.ReactNode; label: string; activeClass: string }[] = [
    {
      value: "yes",
      icon: <Check className="w-4 h-4" />,
      label: "Ja",
      activeClass: "bg-success text-success-foreground border-success",
    },
    {
      value: "maybe",
      icon: <HelpCircle className="w-4 h-4" />,
      label: "Vielleicht",
      activeClass: "bg-warning text-warning-foreground border-warning",
    },
    {
      value: "no",
      icon: <X className="w-4 h-4" />,
      label: "Nein",
      activeClass: "bg-destructive text-destructive-foreground border-destructive",
    },
  ]

  return (
    <div className="flex gap-1">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          disabled={disabled}
          onClick={() => onChange(option.value)}
          className={cn(
            "w-10 h-10 rounded-lg border-2 flex items-center justify-center transition-all duration-200",
            "hover:scale-105 active:scale-95",
            "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100",
            value === option.value
              ? option.activeClass
              : "border-border bg-background text-muted-foreground hover:border-primary/50"
          )}
          title={option.label}
        >
          {option.icon}
        </button>
      ))}
    </div>
  )
}

interface VoteDisplayProps {
  value: VoteValue
  size?: "sm" | "md"
}

export function VoteDisplay({ value, size = "md" }: VoteDisplayProps) {
  const sizeClasses = size === "sm" ? "w-6 h-6" : "w-8 h-8"
  const iconSize = size === "sm" ? "w-3 h-3" : "w-4 h-4"

  const configs: Record<VoteValue, { icon: React.ReactNode; className: string }> = {
    yes: {
      icon: <Check className={iconSize} />,
      className: "bg-success/15 text-success",
    },
    maybe: {
      icon: <HelpCircle className={iconSize} />,
      className: "bg-warning/15 text-warning-foreground",
    },
    no: {
      icon: <X className={iconSize} />,
      className: "bg-destructive/15 text-destructive",
    },
  }

  const config = configs[value]

  return (
    <div
      className={cn(
        "rounded-md flex items-center justify-center",
        sizeClasses,
        config.className
      )}
    >
      {config.icon}
    </div>
  )
}
