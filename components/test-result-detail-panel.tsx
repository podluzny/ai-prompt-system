"use client"

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetClose } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Clock,
  MessageSquare,
  Target,
  CheckCircle2,
  XCircle,
  Eye,
  FileText,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { useState, useRef, useEffect } from "react"

import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypeSanitize from "rehype-sanitize"
import { ResponseFlags } from "@/components/response-flags"

interface ResponseDetail {
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

interface TestResultDetailPanelProps {
  response: ResponseDetail | null
  open: boolean
  onOpenChange: (open: boolean) => void
  keywords: string[]
  regexPatterns: string[]
  onPrevious?: () => void
  onNext?: () => void
  hasPrevious?: boolean
  hasNext?: boolean
  onFlagsUpdate?: (responseId: string, flags: string[]) => void
}

export function TestResultDetailPanel({
  response,
  open,
  onOpenChange,
  keywords,
  regexPatterns,
  onPrevious,
  onNext,
  hasPrevious = false,
  hasNext = false,
  onFlagsUpdate,
}: TestResultDetailPanelProps) {
  const [viewMode, setViewMode] = useState<"html" | "plain">("html")
  const touchStartX = useRef<number | null>(null)
  const touchEndX = useRef<number | null>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const minSwipeDistance = 50

    const onTouchStart = (e: TouchEvent) => {
      touchEndX.current = null
      touchStartX.current = e.targetTouches[0].clientX
    }

    const onTouchMove = (e: TouchEvent) => {
      touchEndX.current = e.targetTouches[0].clientX
    }

    const onTouchEnd = () => {
      if (!touchStartX.current || !touchEndX.current) return

      const distance = touchStartX.current - touchEndX.current
      const isLeftSwipe = distance > minSwipeDistance
      const isRightSwipe = distance < -minSwipeDistance

      if (isLeftSwipe && hasNext && onNext) {
        onNext()
      }
      if (isRightSwipe && hasPrevious && onPrevious) {
        onPrevious()
      }
    }

    const element = contentRef.current
    if (element && open) {
      element.addEventListener("touchstart", onTouchStart)
      element.addEventListener("touchmove", onTouchMove)
      element.addEventListener("touchend", onTouchEnd)

      return () => {
        element.removeEventListener("touchstart", onTouchStart)
        element.removeEventListener("touchmove", onTouchMove)
        element.removeEventListener("touchend", onTouchEnd)
      }
    }
  }, [open, hasPrevious, hasNext, onPrevious, onNext])

  if (!response) return null

  const totalSearchTerms = keywords.length + regexPatterns.length

  const foundTermsCount =
    Object.keys(response.keywords_found || {}).length + Object.keys(response.regex_matches || {}).length

  const totalMatches =
    Object.values(response.keywords_found || {}).reduce((sum, count) => sum + count, 0) +
    Object.values(response.regex_matches || {}).reduce((sum, count) => sum + count, 0)

  return (
    <Sheet open={open} onOpenChange={onOpenChange} modal={false}>
      <SheetContent ref={contentRef} className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader className="sticky top-0 bg-background z-10 pb-4 border-b">
          <div className="flex items-start gap-4">
            <SheetClose asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                <X className="h-4 w-4" />
              </Button>
            </SheetClose>
            <div className="flex-1">
              <SheetTitle>Детали ответа AI</SheetTitle>
              <SheetDescription>
                <code className="text-sm">{response.ai_model}</code>
              </SheetDescription>
            </div>
            <div className="hidden md:flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={onPrevious}
                disabled={!hasPrevious}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={onNext} disabled={!hasNext}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-0 py-0">
          {/* Status */}
          <Card className="rounded-none shadow-none border-background">
            <CardContent className="pt-0">
              <div className="flex flex-wrap justify-between text-sm items-center gap-4">
                <div className="flex items-center gap-2">
                  {response.status === "success" ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                  <span className="text-muted-foreground">Статус:</span>
                  <Badge variant={response.status === "success" ? "default" : "destructive"}>{response.status}</Badge>
                </div>

                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span className="text-muted-foreground">Время выполнения:</span>
                  <span className="font-semibold">
                    {response.response_time_ms ? `${response.response_time_ms}ms` : "N/A"}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Время запроса:</span>
                  <span className="text-sm">{new Date(response.created_at).toLocaleString("ru-RU")}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Prompt */}
          <Card className="rounded-none shadow-none border-t">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Промпт
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm whitespace-pre-wrap bg-muted p-3 rounded-md">{response.request_text}</div>
            </CardContent>
          </Card>

          {/* Response */}
          {response.response_text && (
            <Card className="rounded-none shadow-none border-t">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-medium">Ответ AI</CardTitle>
                <div className="flex gap-1">
                  <Button
                    variant={viewMode === "html" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode("html")}
                    className="h-8 px-2"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    HTML
                  </Button>
                  <Button
                    variant={viewMode === "plain" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode("plain")}
                    className="h-8 px-2"
                  >
                    <FileText className="h-4 w-4 mr-1" />
                    Plain
                  </Button>
                </div>
              </CardHeader>

              <CardContent>
                {viewMode === "html" ? (
                  <div className="text-sm bg-muted p-3 rounded-md prose prose-sm max-w-none">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeSanitize]}
                      components={{
                        h1: ({ children }) => <h1 className="text-2xl font-bold mt-4 mb-2">{children}</h1>,
                        h2: ({ children }) => <h2 className="text-xl font-semibold mt-4 mb-2">{children}</h2>,
                        h3: ({ children }) => <h3 className="text-lg font-semibold mt-4 mb-2">{children}</h3>,
                        p: ({ children }) => <p className="my-2 leading-relaxed">{children}</p>,
                        code: ({ inline, children }) =>
                          inline ? (
                            <code className="bg-gray-200 px-1 rounded text-sm">{children}</code>
                          ) : (
                            <pre className="bg-gray-800 text-gray-100 p-3 rounded my-2 overflow-x-auto">
                              <code>{children}</code>
                            </pre>
                          ),
                        a: ({ href, children }) => (
                          <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            {children}
                          </a>
                        ),
                        ul: ({ children }) => <ul className="list-disc ml-4 my-2">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal ml-4 my-2">{children}</ol>,
                        li: ({ children }) => <li className="my-1">{children}</li>,
                      }}
                    >
                      {response.response_text}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <div className="text-sm bg-muted p-3 rounded-md whitespace-pre-wrap font-mono">
                    {response.response_text}
                  </div>
                )}

                {/* ResponseFlags */}
                <div className="border-t mt-2 pt-2">
                  <ResponseFlags
                    responseId={response.id}
                    initialFlags={response.flags || []}
                    onFlagsChange={(newFlags) => {
                      if (onFlagsUpdate) {
                        onFlagsUpdate(response.id, newFlags)
                      }
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Search Results */}
          <Card className="rounded-none border-t">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Target className="h-4 w-4" />
                Результаты поиска
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">Процент совпадений</div>
                <div className="text-2xl font-bold">{response.match_percentage.toFixed(1)}%</div>
              </div>

              <div className="flex items-center justify-between border-t pt-4">
                <div className="text-sm text-muted-foreground">Найдено терминов</div>
                <div className="text-lg font-semibold">
                  {foundTermsCount} / {totalSearchTerms}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">Всего совпадений</div>
                <div className="text-lg font-semibold">{totalMatches}</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </SheetContent>
    </Sheet>
  )
}
