import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TestResultsWrapper } from "@/components/test-results-wrapper"
import { TestResultsExport } from "@/components/test-results-export"

export default async function TestResultsPage({ params }: { params: Promise<{ testRunId: string }> }) {
  const { testRunId } = await params
  const supabase = await createClient()

  const { data: testRun } = await supabase
    .from("test_runs")
    .select(`
      *,
      projects (name, description, keywords, regex_patterns)
    `)
    .eq("id", testRunId)
    .single()

  if (!testRun) {
    notFound()
  }

  const { data: responses } = await supabase
    .from("ai_responses")
    .select(`
      *,
      prompts (order_index)
    `)
    .eq("test_run_id", testRunId)
    .order("created_at", { ascending: true })

  // Sort responses by prompt order_index to maintain consistent order across models
  const sortedResponses = responses?.sort((a, b) => {
    const aIndex = (a.prompts as any)?.order_index ?? 999
    const bIndex = (b.prompts as any)?.order_index ?? 999
    return aIndex - bIndex
  })

  const project = testRun.projects as any

  // Calculate statistics
  const successfulResponses = sortedResponses?.filter((r) => r.status === "success") || []
  const avgMatchPercentage =
    successfulResponses.length > 0
      ? successfulResponses.reduce((sum, r) => sum + (r.match_percentage || 0), 0) / successfulResponses.length
      : 0

  // Group by AI model (already sorted by prompt order)
  const byModel = sortedResponses?.reduce(
    (acc, response) => {
      if (!acc[response.ai_model]) {
        acc[response.ai_model] = []
      }
      acc[response.ai_model].push(response)
      return acc
    },
    {} as Record<string, typeof sortedResponses>,
  )

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
        <Link href={`/projects/${testRun.project_id}?tab=results`}>
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Назад к проекту
          </Button>
        </Link>

        {sortedResponses && sortedResponses.length > 0 && (
          <TestResultsExport testRun={testRun} project={project} responses={sortedResponses} />
        )}
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Результаты теста</h1>
        <p className="text-muted-foreground mt-2">
          Проект: {project?.name} | Запущен: {new Date(testRun.started_at).toLocaleString("ru-RU")}
        </p>
      </div>

      {/* Summary Statistics */}
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Card className="bg-primary-foreground shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Всего запросов</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{testRun.total_requests}</div>
          </CardContent>
        </Card>
        <Card className="bg-primary-foreground shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Успешно</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{testRun.completed_requests}</div>
          </CardContent>
        </Card>
        <Card className="bg-primary-foreground shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Ошибок</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{testRun.failed_requests}</div>
          </CardContent>
        </Card>
        <Card className="bg-primary-foreground shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Средний % совпадений</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgMatchPercentage.toFixed(1)}%</div>
          </CardContent>
        </Card>
      </div>

      {byModel && (
        <TestResultsWrapper
          byModel={byModel}
          keywords={project?.keywords || []}
          regexPatterns={project?.regex_patterns || []}
        />
      )}
    </div>
  )
}
