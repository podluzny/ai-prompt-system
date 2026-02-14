"use client"

import type React from "react"
import { X } from "lucide-react" // Import the X component

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Lightbulb, AlertTriangle, XCircle, ThumbsUp, ThumbsDown } from "lucide-react"
import type { ResponseFlag } from "@/lib/types"

interface ResponseFlagsProps {
  responseId: string
  initialFlags: string[]
  onFlagsChange?: (flags: string[]) => void
}

const FLAG_CONFIG: Record<
  ResponseFlag,
  {
    label: string
    icon: React.ComponentType<{ className?: string }>
    color: string
    hoverColor: string
  }
> = {
  interesting: {
    label: "Интересно",
    icon: Lightbulb,
    color: "bg-yellow-100 text-yellow-800 border-yellow-300",
    hoverColor: "hover:bg-yellow-200",
  },
  needs_attention: {
    label: "Внимание",
    icon: AlertTriangle,
    color: "bg-orange-100 text-orange-800 border-orange-300",
    hoverColor: "hover:bg-orange-200",
  },
  error_flag: {
    label: "Ошибка",
    icon: XCircle,
    color: "bg-red-100 text-red-800 border-red-300",
    hoverColor: "hover:bg-red-200",
  },
  good_response: {
    label: "Хороший ответ",
    icon: ThumbsUp,
    color: "bg-green-100 text-green-800 border-green-300",
    hoverColor: "hover:bg-green-200",
  },
  bad_response: {
    label: "Плохой ответ",
    icon: ThumbsDown,
    color: "bg-gray-100 text-gray-800 border-gray-300",
    hoverColor: "hover:bg-gray-200",
  },
}

export function ResponseFlags({ responseId, initialFlags, onFlagsChange }: ResponseFlagsProps) {
  const [flags, setFlags] = useState<string[]>(initialFlags || [])
  const [saving, setSaving] = useState(false)

  // Sync local state with props when responseId changes (user navigates to different response)
  useEffect(() => {
    setFlags(initialFlags || [])
  }, [responseId, initialFlags])

  const toggleFlag = async (flag: ResponseFlag) => {
    const newFlags = flags.includes(flag) ? flags.filter((f) => f !== flag) : [...flags, flag]

    setFlags(newFlags)
    setSaving(true)

    try {
      const response = await fetch("/api/update-response-flags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ responseId, flags: newFlags }),
      })

      if (!response.ok) {
        throw new Error("Failed to update flags")
      }

      onFlagsChange?.(newFlags)
    } catch (error) {
      console.error("[v0] Error updating flags:", error)
      setFlags(flags)
    } finally {
      setSaving(false)
    }
  }

  const removeFlag = async (flag: ResponseFlag) => {
    await toggleFlag(flag)
  }

  return (
    <div className="space-y-3">
      {/* Active flags as badges with X buttons */}
      {flags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {(Object.keys(FLAG_CONFIG) as ResponseFlag[])
            .filter((flag) => flags.includes(flag))
            .map((flag) => {
              const config = FLAG_CONFIG[flag]
              const Icon = config.icon

              return (
                <Badge
                  key={flag}
                  variant="outline"
                  className={`${config.color} pr-1 gap-1 cursor-default`}
                >
                  <Icon className="h-3 w-3" />
                  {config.label}
                  <button
                    type="button"
                    onClick={() => removeFlag(flag)}
                    className="ml-1 hover:bg-black/10 rounded-full p-0.5 transition-colors"
                    aria-label={`Удалить флаг ${config.label}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )
            })}
        </div>
      )}

      {/* Buttons to add flags */}
      <div className="flex flex-wrap gap-1.5">
        {(Object.keys(FLAG_CONFIG) as ResponseFlag[]).map((flag) => {
          const config = FLAG_CONFIG[flag]
          const Icon = config.icon
          const isActive = flags.includes(flag)

          return (
            <Badge
              key={flag}
              variant="outline"
              className={`cursor-pointer transition-all text-sm ${
                isActive ? config.color : "bg-background hover:bg-muted"
              } ${config.hoverColor}`}
              onClick={() => toggleFlag(flag)}
            >
              <Icon className="h-3 w-3 mr-1" />
              {config.label}
            </Badge>
          )
        })}
      </div>
      {saving && <div className="text-xs text-muted-foreground">Сохранение...</div>}
    </div>
  )
}
