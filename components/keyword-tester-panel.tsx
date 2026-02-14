"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose } from "@/components/ui/sheet"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { X, TestTube2 } from "lucide-react"

interface KeywordTesterPanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  keywords: string[]
  regexPatterns: string[]
}

interface TestResult {
  term: string
  count: number
  type: "keyword" | "regex"
}

export function KeywordTesterPanel({ open, onOpenChange, keywords, regexPatterns }: KeywordTesterPanelProps) {
  const [testText, setTestText] = useState("")
  const [results, setResults] = useState<TestResult[]>([])
  const [hasRun, setHasRun] = useState(false)

  const handleTest = () => {
    const newResults: TestResult[] = []

    // Test keywords
    keywords.forEach((keyword) => {
      const regex = new RegExp(keyword, "gi")
      const matches = testText.match(regex)
      newResults.push({
        term: keyword,
        count: matches ? matches.length : 0,
        type: "keyword",
      })
    })

    // Test regex patterns
    regexPatterns.forEach((pattern) => {
      try {
        const regex = new RegExp(pattern, "gi")
        const matches = testText.match(regex)
        newResults.push({
          term: pattern,
          count: matches ? matches.length : 0,
          type: "regex",
        })
      } catch (error) {
        console.error("Invalid regex pattern:", pattern, error)
        newResults.push({
          term: pattern,
          count: 0,
          type: "regex",
        })
      }
    })

    setResults(newResults)
    setHasRun(true)
  }

  const handleClear = () => {
    setTestText("")
    setResults([])
    setHasRun(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange} modal={false}>
      <SheetContent className="w-[600px] sm:max-w-[600px] overflow-y-auto">
        <SheetHeader className="sticky top-0 bg-background z-10 pb-4 border-b">
          <div className="flex items-center gap-2">
            <SheetClose className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100">
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </SheetClose>
            <SheetTitle className="flex items-center gap-2">
              <TestTube2 className="h-5 w-5" />
              Тестер ключевых слов и выражений
            </SheetTitle>
          </div>
        </SheetHeader>

        <div className="space-y-6 py-4">
          {/* Input Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Тестовый текст</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={testText}
                onChange={(e) => setTestText(e.target.value)}
                placeholder="Введите текст для проверки на наличие ключевых слов и регулярных выражений..."
                className="min-h-[200px] font-mono text-sm"
              />
              <div className="flex gap-2">
                <Button onClick={handleTest} disabled={!testText.trim()} className="flex-1">
                  <TestTube2 className="h-4 w-4 mr-2" />
                  Тестировать
                </Button>
                <Button variant="outline" onClick={handleClear}>
                  Очистить
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Results Section */}
          {hasRun && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Результаты</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Keywords Results */}
                {keywords.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground">Ключевые слова</h4>
                    <div className="space-y-2">
                      {results
                        .filter((r) => r.type === "keyword")
                        .map((result) => (
                          <div
                            key={result.term}
                            className="flex items-center justify-between p-3 border rounded-md bg-muted/30"
                          >
                            <span className="text-sm font-medium">{result.term}</span>
                            <Badge variant={result.count > 0 ? "default" : "secondary"}>
                              {result.count} {result.count === 1 ? "вхождение" : "вхождений"}
                            </Badge>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Regex Results */}
                {regexPatterns.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground">Регулярные выражения</h4>
                    <div className="space-y-2">
                      {results
                        .filter((r) => r.type === "regex")
                        .map((result) => (
                          <div
                            key={result.term}
                            className="flex items-center justify-between p-3 border rounded-md bg-muted/30"
                          >
                            <code className="text-sm font-mono flex-1 break-all">{result.term}</code>
                            <Badge variant={result.count > 0 ? "default" : "secondary"} className="ml-2">
                              {result.count} {result.count === 1 ? "совпадение" : "совпадений"}
                            </Badge>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Summary */}
                <div className="pt-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    Всего найдено:{" "}
                    <span className="font-semibold text-foreground">
                      {results.reduce((sum, r) => sum + r.count, 0)} совпадений
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Empty State */}
          {keywords.length === 0 && regexPatterns.length === 0 && (
            <Card className="border-dashed">
              <CardContent className="py-8 text-center text-muted-foreground text-sm">
                Добавьте ключевые слова или регулярные выражения для тестирования
              </CardContent>
            </Card>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
