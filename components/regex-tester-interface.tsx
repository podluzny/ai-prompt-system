"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Plus, Trash2, Search } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export function RegexTesterInterface() {
  const [testText, setTestText] = useState("")
  const [keywords, setKeywords] = useState<string[]>([])
  const [regexPatterns, setRegexPatterns] = useState<string[]>([])
  const [newKeyword, setNewKeyword] = useState("")
  const [newRegex, setNewRegex] = useState("")
  const [results, setResults] = useState<{
    keywords: Record<string, number>
    regex: Record<string, number>
  } | null>(null)

  const runTest = () => {
    const keywordResults: Record<string, number> = {}
    const regexResults: Record<string, number> = {}

    // Test keywords (case-insensitive)
    keywords.forEach((keyword) => {
      const regex = new RegExp(keyword, "gi")
      const matches = testText.match(regex)
      keywordResults[keyword] = matches ? matches.length : 0
    })

    // Test regex patterns
    regexPatterns.forEach((pattern) => {
      try {
        const regex = new RegExp(pattern, "gi")
        const matches = testText.match(regex)
        regexResults[pattern] = matches ? matches.length : 0
      } catch (error) {
        regexResults[pattern] = -1 // Error in pattern
      }
    })

    setResults({ keywords: keywordResults, regex: regexResults })
  }

  const addKeyword = () => {
    if (newKeyword.trim() && !keywords.includes(newKeyword.trim())) {
      setKeywords([...keywords, newKeyword.trim()])
      setNewKeyword("")
    }
  }

  const addRegex = () => {
    if (newRegex.trim() && !regexPatterns.includes(newRegex.trim())) {
      setRegexPatterns([...regexPatterns, newRegex.trim()])
      setNewRegex("")
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Тестовый текст</CardTitle>
            <CardDescription>Вставьте текст или HTML для анализа</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={testText}
              onChange={(e) => setTestText(e.target.value)}
              placeholder="Вставьте текст для тестирования..."
              rows={15}
              className="font-mono text-sm"
            />
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Ключевые слова</CardTitle>
            <CardDescription>Добавьте слова для поиска</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addKeyword())}
                placeholder="Добавить слово..."
              />
              <Button onClick={addKeyword} size="icon">
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              {keywords.map((keyword) => (
                <Badge key={keyword} variant="secondary" className="gap-2">
                  {keyword}
                  <button
                    onClick={() => setKeywords(keywords.filter((k) => k !== keyword))}
                    className="hover:text-destructive cursor-pointer"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Регулярные выражения</CardTitle>
            <CardDescription>Добавьте regex паттерны</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={newRegex}
                onChange={(e) => setNewRegex(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addRegex())}
                placeholder="Добавить regex..."
                className="font-mono text-sm"
              />
              <Button onClick={addRegex} size="icon">
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-2">
              {regexPatterns.map((pattern) => (
                <div key={pattern} className="flex items-center gap-2 p-2 border rounded-md">
                  <code className="flex-1 text-sm font-mono break-all">{pattern}</code>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setRegexPatterns(regexPatterns.filter((r) => r !== pattern))}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Button onClick={runTest} className="w-full" size="lg">
          <Search className="mr-2 h-5 w-5" />
          Запустить тест
        </Button>

        {results && (
          <Card>
            <CardHeader>
              <CardTitle>Результаты</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Ключевые слова:</h3>
                <div className="space-y-1">
                  {Object.entries(results.keywords).map(([keyword, count]) => (
                    <div key={keyword} className="flex justify-between text-sm p-2 border rounded">
                      <span>{keyword}</span>
                      <Badge variant={count > 0 ? "default" : "secondary"}>
                        {count} {count === 1 ? "вхождение" : "вхождений"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Регулярные выражения:</h3>
                <div className="space-y-1">
                  {Object.entries(results.regex).map(([pattern, count]) => (
                    <div key={pattern} className="flex justify-between text-sm p-2 border rounded">
                      <code className="text-xs flex-1 break-all">{pattern}</code>
                      <Badge variant={count > 0 ? "default" : count === -1 ? "destructive" : "secondary"}>
                        {count === -1 ? "Ошибка" : `${count} ${count === 1 ? "совпадение" : "совпадений"}`}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
