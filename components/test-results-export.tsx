"use client"

import { Button } from "@/components/ui/button"
import { Download, FileJson, FileText, Table } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

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

interface TestResultsExportProps {
  testRun: {
    id: string
    project_id: string
    started_at: string
    completed_at: string | null
    status: string
    total_requests: number
    completed_requests: number
    failed_requests: number
  }
  project: {
    name: string
    description: string | null
    keywords: string[]
    regex_patterns: string[]
  }
  responses: Response[]
}

export function TestResultsExport({ testRun, project, responses }: TestResultsExportProps) {
  const generateCSV = () => {
    const lines: string[] = []

    lines.push("# ИНФОРМАЦИЯ О ПРОЕКТЕ И ТЕСТЕ")
    lines.push(`Проект,${escapeCSV(project.name)}`)
    lines.push(`Описание,${escapeCSV(project.description || "")}`)
    lines.push(`ID теста,${testRun.id}`)
    lines.push(`Статус,${testRun.status}`)
    lines.push(`Начало,${new Date(testRun.started_at).toLocaleString("ru-RU")}`)
    lines.push(
      `Завершение,${testRun.completed_at ? new Date(testRun.completed_at).toLocaleString("ru-RU") : "В процессе"}`,
    )
    lines.push(`Всего запросов,${testRun.total_requests}`)
    lines.push(`Успешных,${testRun.completed_requests}`)
    lines.push(`Ошибок,${testRun.failed_requests}`)
    lines.push(`Ключевые слова,"${project.keywords.join(", ")}"`)
    lines.push(`Регулярные выражения,"${project.regex_patterns.join(", ")}"`)
    lines.push("")
    lines.push("# РЕЗУЛЬТАТЫ ЗАПРОСОВ")

    // Headers
    lines.push("AI Модель,Промпт,Статус,% совпадений,Найдено слов,Совпадения regex,Время ответа (мс),Дата,Ответ,Ошибка")

    // Data rows
    responses.forEach((response) => {
      const keywordsFoundCount = Object.keys(response.keywords_found || {}).length
      const regexMatchesCount = Object.keys(response.regex_matches || {}).length

      lines.push(
        [
          escapeCSV(response.ai_model),
          escapeCSV(response.request_text),
          response.status,
          response.match_percentage?.toFixed(1) || "0",
          keywordsFoundCount.toString(),
          regexMatchesCount.toString(),
          response.response_time_ms?.toString() || "",
          new Date(response.created_at).toLocaleString("ru-RU"),
          escapeCSV(response.response_text || ""),
          escapeCSV(response.error_message || ""),
        ].join(","),
      )
    })

    return lines.join("\n")
  }

  const generateJSON = () => {
    const data = {
      project: {
        name: project.name,
        description: project.description,
        keywords: project.keywords,
        regex_patterns: project.regex_patterns,
      },
      test_run: {
        id: testRun.id,
        project_id: testRun.project_id,
        status: testRun.status,
        started_at: testRun.started_at,
        completed_at: testRun.completed_at,
        statistics: {
          total_requests: testRun.total_requests,
          completed_requests: testRun.completed_requests,
          failed_requests: testRun.failed_requests,
        },
      },
      responses: responses.map((response) => ({
        id: response.id,
        ai_model: response.ai_model,
        request_text: response.request_text,
        response_text: response.response_text,
        status: response.status,
        match_percentage: response.match_percentage,
        keywords_found: response.keywords_found,
        regex_matches: response.regex_matches,
        response_time_ms: response.response_time_ms,
        created_at: response.created_at,
        error_message: response.error_message,
      })),
    }

    return JSON.stringify(data, null, 2)
  }

  const generateTXT = () => {
    const lines: string[] = []

    lines.push("=".repeat(80))
    lines.push("РЕЗУЛЬТАТЫ ТЕСТИРОВАНИЯ AI ПРОМПТОВ")
    lines.push("=".repeat(80))
    lines.push("")

    lines.push("ИНФОРМАЦИЯ О ПРОЕКТЕ")
    lines.push("-".repeat(80))
    lines.push(`Название: ${project.name}`)
    if (project.description) {
      lines.push(`Описание: ${project.description}`)
    }
    lines.push(`Ключевые слова: ${project.keywords.join(", ")}`)
    lines.push(`Регулярные выражения: ${project.regex_patterns.join(", ")}`)
    lines.push("")

    lines.push("ИНФОРМАЦИЯ О ТЕСТЕ")
    lines.push("-".repeat(80))
    lines.push(`ID теста: ${testRun.id}`)
    lines.push(`Статус: ${testRun.status}`)
    lines.push(`Начало: ${new Date(testRun.started_at).toLocaleString("ru-RU")}`)
    lines.push(
      `Завершение: ${testRun.completed_at ? new Date(testRun.completed_at).toLocaleString("ru-RU") : "В процессе"}`,
    )
    lines.push(`Всего запросов: ${testRun.total_requests}`)
    lines.push(`Успешных: ${testRun.completed_requests}`)
    lines.push(`Ошибок: ${testRun.failed_requests}`)
    lines.push("")

    lines.push("РЕЗУЛЬТАТЫ ЗАПРОСОВ")
    lines.push("-".repeat(80))

    const byModel = responses.reduce(
      (acc, response) => {
        if (!acc[response.ai_model]) {
          acc[response.ai_model] = []
        }
        acc[response.ai_model].push(response)
        return acc
      },
      {} as Record<string, Response[]>,
    )

    Object.entries(byModel).forEach(([model, modelResponses]) => {
      lines.push("")
      lines.push(`AI МОДЕЛЬ: ${model}`)
      lines.push("~".repeat(80))
      lines.push("")

      modelResponses.forEach((response, index) => {
        lines.push(`${index + 1}. Запрос #${response.id.slice(0, 8)}`)
        lines.push(`   Промпт: ${response.request_text}`)
        lines.push(`   Статус: ${response.status}`)
        lines.push(`   Процент совпадений: ${response.match_percentage?.toFixed(1)}%`)
        lines.push(`   Найдено ключевых слов: ${Object.keys(response.keywords_found || {}).length}`)
        lines.push(`   Совпадения regex: ${Object.keys(response.regex_matches || {}).length}`)
        if (response.response_time_ms) {
          lines.push(`   Время ответа: ${response.response_time_ms}мс`)
        }
        lines.push(`   Дата: ${new Date(response.created_at).toLocaleString("ru-RU")}`)

        if (response.status === "success" && response.response_text) {
          lines.push(`   Ответ:`)
          lines.push(`   ${response.response_text.split("\n").join("\n   ")}`)
        }

        if (response.error_message) {
          lines.push(`   Ошибка: ${response.error_message}`)
        }

        lines.push("")
      })
    })

    return lines.join("\n")
  }

  const escapeCSV = (str: string) => {
    if (!str) return ""
    const needsQuotes = str.includes(",") || str.includes('"') || str.includes("\n")
    if (needsQuotes) {
      return `"${str.replace(/"/g, '""')}"`
    }
    return str
  }

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleExportCSV = () => {
    const content = generateCSV()
    const filename = `test-results-${testRun.id.slice(0, 8)}-${Date.now()}.csv`
    downloadFile(content, filename, "text/csv;charset=utf-8;")
  }

  const handleExportJSON = () => {
    const content = generateJSON()
    const filename = `test-results-${testRun.id.slice(0, 8)}-${Date.now()}.json`
    downloadFile(content, filename, "application/json")
  }

  const handleExportTXT = () => {
    const content = generateTXT()
    const filename = `test-results-${testRun.id.slice(0, 8)}-${Date.now()}.txt`
    downloadFile(content, filename, "text/plain;charset=utf-8;")
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 bg-transparent">
          <Download className="h-4 w-4" />
          Экспорт
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleExportCSV} className="gap-2 cursor-pointer">
          <Table className="h-4 w-4" />
          Экспорт в CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportJSON} className="gap-2 cursor-pointer">
          <FileJson className="h-4 w-4" />
          Экспорт в JSON
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportTXT} className="gap-2 cursor-pointer">
          <FileText className="h-4 w-4" />
          Экспорт в TXT
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
