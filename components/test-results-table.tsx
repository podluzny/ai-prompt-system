"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { TestResultDetailPanel } from "./test-result-detail-panel"

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
}

interface TestResultsTableProps {
  responses: Response[]
  keywords: string[]
  regexPatterns: string[]
}

export function TestResultsTable({ responses, keywords, regexPatterns }: TestResultsTableProps) {
  const [selectedResponse, setSelectedResponse] = useState<Response | null>(null)
  const [panelOpen, setPanelOpen] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!panelOpen || !selectedResponse) return

      const currentIndex = responses.findIndex((r) => r.id === selectedResponse.id)
      if (currentIndex === -1) return

      let newIndex = currentIndex

      if (e.key === "ArrowLeft" || e.key === "4") {
        e.preventDefault()
        newIndex = currentIndex > 0 ? currentIndex - 1 : responses.length - 1
      } else if (e.key === "ArrowRight" || e.key === "6") {
        e.preventDefault()
        newIndex = currentIndex < responses.length - 1 ? currentIndex + 1 : 0
      }

      if (newIndex !== currentIndex) {
        setSelectedResponse(responses[newIndex])
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [panelOpen, selectedResponse, responses])

  const handleRowClick = (response: Response) => {
    setSelectedResponse(response)
    setPanelOpen(true)
  }

  const totalSearchTerms = keywords.length + regexPatterns.length

  return (
    <>
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
          {responses.map((response) => {
            const foundCount =
              Object.keys(response.keywords_found || {}).length + Object.keys(response.regex_matches || {}).length

            const isSelected = selectedResponse?.id === response.id

            return (
              <TableRow
                key={response.id}
                className={`cursor-pointer hover:bg-muted/50 transition-colors ${isSelected ? "bg-primary/10" : ""}`}
                onClick={() => handleRowClick(response)}
              >
                <TableCell className="max-w-md">
                  <div className="truncate text-sm">{response.request_text}</div>
                </TableCell>
                <TableCell>
                  <Badge variant={response.status === "success" ? "default" : "destructive"}>{response.status}</Badge>
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

      <TestResultDetailPanel
        response={selectedResponse}
        open={panelOpen}
        onOpenChange={setPanelOpen}
        keywords={keywords}
        regexPatterns={regexPatterns}
      />
    </>
  )
}
