"use client"

import React from "react"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Search, X, Filter, Lightbulb, AlertTriangle, XCircle, ThumbsUp, ThumbsDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { TestResultDetailPanel } from "./test-result-detail-panel"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { ResponseFlag } from "@/lib/types"

interface Response {
  id: string
  ai_model: string
  request_text: string
  response_text: string | null
  status: string
  keywords_found: Record<string, number>
  regex_matches: Record<string, number>
  match_percentage: number
  response_time_ms: number | null
  created_at: string
  error_message: string | null
  flags?: string[]
}

interface TestResultsWrapperProps {
  byModel: Record<string, Response[]>
  keywords: string[]
  regexPatterns: string[]
}

const FLAG_ICONS: Record<
  ResponseFlag,
  {
    icon: React.ComponentType<{ className?: string }>
    color: string
  }
> = {
  interesting: { icon: Lightbulb, color: "text-yellow-600" },
  needs_attention: { icon: AlertTriangle, color: "text-orange-600" },
  error_flag: { icon: XCircle, color: "text-red-600" },
  good_response: { icon: ThumbsUp, color: "text-green-600" },
  bad_response: { icon: ThumbsDown, color: "text-gray-600" },
}

export function TestResultsWrapper({ byModel, keywords, regexPatterns }: TestResultsWrapperProps) {
  const [responses, setResponses] = useState<Record<string, Response[]>>(byModel)
  const [selectedResponse, setSelectedResponse] = useState<Response | null>(null)
  const [panelOpen, setPanelOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedFlags, setSelectedFlags] = useState<ResponseFlag[]>([])
  const rowRefs = useRef<Map<string, HTMLTableRowElement>>(new Map())
  const containerRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setResponses(byModel)
  }, [byModel])

  const totalSearchTerms = keywords.length + regexPatterns.length

  const filteredByModel = Object.entries(responses).reduce(
    (acc, [model, modelResponses]) => {
      const filtered = modelResponses.filter((r) => {
        const matchesSearch = r.request_text.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesFlags = selectedFlags.length === 0 || selectedFlags.some((flag) => r.flags?.includes(flag))
        return matchesSearch && matchesFlags
      })
      if (filtered.length > 0) {
        acc[model] = filtered
      }
      return acc
    },
    {} as Record<string, Response[]>,
  )

  const allResponses = Object.entries(filteredByModel).flatMap(([model, responses]) =>
    responses.map((r) => ({ ...r, _model: model })),
  )

  // Added navigation functions
  const handlePrevious = () => {
    if (!selectedResponse || allResponses.length === 0) return
    const currentIndex = allResponses.findIndex((r) => r.id === selectedResponse.id)
    if (currentIndex === -1) return

    const newIndex = currentIndex > 0 ? currentIndex - 1 : allResponses.length - 1
    const newResponse = allResponses[newIndex]
    setSelectedResponse(newResponse)

    const rowElement = rowRefs.current.get(newResponse.id)
    if (rowElement) {
      rowElement.scrollIntoView({ behavior: "smooth", block: "center" })
    }
  }

  const handleNext = () => {
    if (!selectedResponse || allResponses.length === 0) return
    const currentIndex = allResponses.findIndex((r) => r.id === selectedResponse.id)
    if (currentIndex === -1) return

    const newIndex = currentIndex < allResponses.length - 1 ? currentIndex + 1 : 0
    const newResponse = allResponses[newIndex]
    setSelectedResponse(newResponse)

    const rowElement = rowRefs.current.get(newResponse.id)
    if (rowElement) {
      rowElement.scrollIntoView({ behavior: "smooth", block: "center" })
    }
  }

  const currentIndex = selectedResponse ? allResponses.findIndex((r) => r.id === selectedResponse.id) : -1
  const hasPrevious = currentIndex > 0
  const hasNext = currentIndex >= 0 && currentIndex < allResponses.length - 1

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isSearchFocused = document.activeElement === searchInputRef.current

      if ((e.ctrlKey || e.metaKey) && (e.key === "f" || e.key === "а" || e.key === "F" || e.key === "А")) {
        e.preventDefault()
        searchInputRef.current?.focus()
        return
      }

      if (e.key === "Tab" && !e.shiftKey && isSearchFocused) {
        e.preventDefault()
        if (allResponses.length > 0) {
          setSelectedResponse(allResponses[0])
          const firstRow = rowRefs.current.get(allResponses[0].id)
          if (firstRow) {
            firstRow.scrollIntoView({ behavior: "smooth", block: "center" })
          }
        }
        return
      }

      if (e.key === "Enter" && isSearchFocused) {
        e.preventDefault()
        if (allResponses.length > 0) {
          setSelectedResponse(allResponses[0])
          setPanelOpen(true)
          const firstRow = rowRefs.current.get(allResponses[0].id)
          if (firstRow) {
            firstRow.scrollIntoView({ behavior: "smooth", block: "center" })
          }
        }
        return
      }

      if (e.key === " " || e.key === "Spacebar") {
        if (!isSearchFocused) {
          e.preventDefault()
          if (selectedResponse) {
            setPanelOpen((prev) => !prev)
          }
        }
        return
      }

      if (e.key === "Tab" && !e.shiftKey && !isSearchFocused) {
        e.preventDefault()
        if (containerRef.current && allResponses.length > 0) {
          if (!selectedResponse && allResponses.length > 0) {
            setSelectedResponse(allResponses[0])
            const firstRow = rowRefs.current.get(allResponses[0].id)
            if (firstRow) {
              firstRow.scrollIntoView({ behavior: "smooth", block: "center" })
            }
          }
        }
        return
      }

      if (!selectedResponse || allResponses.length === 0) return

      const currentIndex = allResponses.findIndex((r) => r.id === selectedResponse.id)
      if (currentIndex === -1) return

      const newIndex = currentIndex

      if (e.key === "ArrowLeft" || e.key === "4") {
        e.preventDefault()
        // Use handlePrevious instead of inline logic
        handlePrevious()
        return
      } else if (e.key === "ArrowRight" || e.key === "6") {
        e.preventDefault()
        // Use handleNext instead of inline logic
        handleNext()
        return
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [selectedResponse, allResponses])

  const handleRowClick = (response: Response) => {
    setSelectedResponse(response)
    setPanelOpen(true)
  }

  const toggleFlag = (flag: ResponseFlag) => {
    setSelectedFlags((prev) => (prev.includes(flag) ? prev.filter((f) => f !== flag) : [...prev, flag]))
  }

  const handleFlagsUpdate = (responseId: string, newFlags: string[]) => {
    console.log("[v0] Updating flags for response:", responseId, newFlags)

    setResponses((prev) => {
      const updated = { ...prev }
      for (const model in updated) {
        updated[model] = updated[model].map((r) => (r.id === responseId ? { ...r, flags: newFlags } : r))
      }
      return updated
    })

    if (selectedResponse?.id === responseId) {
      setSelectedResponse((prev) => (prev ? { ...prev, flags: newFlags } : null))
    }
  }

  return (
    <>
      <div ref={containerRef}>
        <div className="mb-6">
          <div className="flex gap-2 max-w-2xl">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                type="text"
                placeholder="Поиск по промптам..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10 shadow-none"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                  onClick={() => setSearchQuery("")}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2 bg-transparent">
                  <Filter className="h-4 w-4" />
                  Флаги
                  {selectedFlags.length > 0 && (
                    <Badge
                      variant="secondary"
                      className="ml-1 h-5 w-5 rounded-full p-0 flex items-center justify-center"
                    >
                      {selectedFlags.length}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Фильтр по флагам</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem
                  checked={selectedFlags.includes("interesting")}
                  onCheckedChange={() => toggleFlag("interesting")}
                >
                  Интересно
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={selectedFlags.includes("needs_attention")}
                  onCheckedChange={() => toggleFlag("needs_attention")}
                >
                  Требует внимания
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={selectedFlags.includes("error_flag")}
                  onCheckedChange={() => toggleFlag("error_flag")}
                >
                  Ошибка
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={selectedFlags.includes("good_response")}
                  onCheckedChange={() => toggleFlag("good_response")}
                >
                  Хороший ответ
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={selectedFlags.includes("bad_response")}
                  onCheckedChange={() => toggleFlag("bad_response")}
                >
                  Плохой ответ
                </DropdownMenuCheckboxItem>
                {selectedFlags.length > 0 && (
                  <>
                    <DropdownMenuSeparator />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => setSelectedFlags([])}
                    >
                      Сбросить фильтры
                    </Button>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          {(searchQuery || selectedFlags.length > 0) && (
            <p className="text-sm text-muted-foreground mt-2">
              Найдено результатов: {allResponses.length}
              {selectedFlags.length > 0 && ` (фильтр: ${selectedFlags.length} флагов)`}
            </p>
          )}
        </div>

        {Object.entries(filteredByModel).map(([model, modelResponses]) => {
          const successCount = modelResponses.filter((r) => r.status === "success").length
          const avgMatch =
            modelResponses
              .filter((r) => r.status === "success")
              .reduce((sum, r) => sum + (r.match_percentage || 0), 0) / (successCount || 1)

          return (
            <Card key={model} className="mb-6 shadow-none">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <code className="text-sm">{model}</code>
                    </CardTitle>
                    <CardDescription>
                      {successCount} успешных из {modelResponses.length} | Средний % совпадений: {avgMatch.toFixed(1)}%
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Промпт</TableHead>
                      <TableHead>Статус</TableHead>
                      <TableHead>% совпадений</TableHead>
                      <TableHead>Найдено слов</TableHead>
                      <TableHead>Время</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {modelResponses.map((response) => {
                      const foundCount =
                        Object.keys(response.keywords_found || {}).length +
                        Object.keys(response.regex_matches || {}).length

                      const isSelected = selectedResponse?.id === response.id

                      return (
                        <TableRow
                          key={response.id}
                          ref={(el) => {
                            if (el) rowRefs.current.set(response.id, el)
                            else rowRefs.current.delete(response.id)
                          }}
                          className={`cursor-pointer hover:bg-muted/50 transition-colors ${isSelected ? "bg-primary/10 ring-primary/50" : ""}`}
                          onClick={() => handleRowClick(response)}
                        >
                          <TableCell className="max-w-md">
                            <div className="flex items-center gap-2">
                              <div className="truncate text-sm flex-1">{response.request_text}</div>
                              {response.flags && response.flags.length > 0 && (
                                <div className="flex items-center gap-1 flex-shrink-0">
                                  {response.flags.map((flag) => {
                                    const config = FLAG_ICONS[flag as ResponseFlag]
                                    if (!config) return null
                                    const Icon = config.icon
                                    return (
                                      <Icon
                                        key={flag}
                                        className={`h-4 w-4 ${config.color}`}
                                        title={flag.replace("_", " ")}
                                      />
                                    )
                                  })}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={response.status === "success" ? "default" : "destructive"}>
                              {response.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div
                              className={`font-medium ${
                                response.match_percentage > 50
                                  ? "text-green-600"
                                  : response.match_percentage > 20
                                    ? "text-yellow-600"
                                    : "text-red-600"
                              }`}
                            >
                              {response.match_percentage?.toFixed(1)}%
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {foundCount} / {totalSearchTerms}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-muted-foreground">
                              {response.response_time_ms ? `${response.response_time_ms}ms` : "-"}
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )
        })}

        <div className="mb-4 p-3 bg-muted/50 rounded-md text-sm text-muted-foreground">
          <strong>Управление:</strong> Ctrl+F (Ctrl+А) - поиск | Tab - выбрать первый промпт | Enter (в поиске) -
          выбрать и открыть | ←→ / 4,6 - переключение между промптами | Пробел - открыть/закрыть детали
        </div>
      </div>

      <TestResultDetailPanel
        response={selectedResponse}
        open={panelOpen}
        onOpenChange={setPanelOpen}
        keywords={keywords}
        regexPatterns={regexPatterns}
        // Added navigation props
        onPrevious={handlePrevious}
        onNext={handleNext}
        hasPrevious={hasPrevious}
        hasNext={hasNext}
        onFlagsUpdate={handleFlagsUpdate}
      />
    </>
  )
}
