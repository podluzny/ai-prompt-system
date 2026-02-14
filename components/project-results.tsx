"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3, ExternalLink, Trash2 } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface TestRun {
  id: string
  status: string
  total_requests: number
  completed_requests: number
  failed_requests: number
  started_at: string
  completed_at: string | null
}

export function ProjectResults({ projectId }: { projectId: string }) {
  const [testRuns, setTestRuns] = useState<TestRun[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()

    const fetchTestRuns = async () => {
      const { data } = await supabase
        .from("test_runs")
        .select("*")
        .eq("project_id", projectId)
        .order("started_at", { ascending: false })

      if (data) {
        setTestRuns(data)
      }
      setLoading(false)
    }

    fetchTestRuns()

    const interval = setInterval(() => {
      const hasRunningTests = testRuns.some((run) => run.status === "running" || run.status === "pending")
      if (hasRunningTests) {
        fetchTestRuns()
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [projectId, testRuns])

  const handleDelete = async (testRunId: string) => {
    setDeleting(testRunId)
    try {
      const response = await fetch(`/api/test-runs/${testRunId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setTestRuns((prev) => prev.filter((run) => run.id !== testRunId))
      } else {
        console.error("Failed to delete test run")
      }
    } catch (error) {
      console.error("Error deleting test run:", error)
    } finally {
      setDeleting(null)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="py-8">
            <p className="text-muted-foreground text-center">Загрузка результатов...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 -mx-6">
      <Card className="bg-primary-foreground border-none shadow-none rounded-none">
        <CardHeader className="px-6">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            История запусков
          </CardTitle>
          <CardDescription>Результаты предыдущих тестирований</CardDescription>
        </CardHeader>
        <CardContent className="px-6">
          {!testRuns || testRuns.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Пока нет запусков. Перейдите на вкладку "Запуск теста" чтобы начать.
            </p>
          ) : (
            <div className="space-y-4">
              {testRuns.map((run) => (
                <div key={run.id} className="p-4 border rounded-lg hover:border-primary transition-colors bg-white">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between mb-2">
                    {run.status === "completed" ||
                    ((run.status === "stopped" || run.status === "running") &&
                      (run.completed_requests > 0 || run.failed_requests > 0)) ? (
                      <Link
                        href={`/results/${run.id}`}
                        className="font-medium hover:text-primary transition-colors cursor-pointer"
                      >
                        Test Run #{run.id.slice(0, 8)}
                      </Link>
                    ) : (
                      <div className="font-medium">Test Run #{run.id.slice(0, 8)}</div>
                    )}
                    <div className="flex items-center gap-2 flex-wrap">
                      <div
                        className={`text-sm px-2 py-1 rounded ${
                          run.status === "completed"
                            ? "bg-green-100 text-green-800"
                            : run.status === "running"
                              ? "bg-blue-100 text-blue-800"
                              : run.status === "failed"
                                ? "bg-red-100 text-red-800"
                                : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {run.status}
                      </div>
                      {(run.status === "completed" ||
                        ((run.status === "stopped" || run.status === "running") &&
                          (run.completed_requests > 0 || run.failed_requests > 0))) && (
                        <Link href={`/results/${run.id}`}>
                          <Button variant="ghost" size="sm" className="gap-1">
                            Подробнее
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </Link>
                      )}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                            disabled={deleting === run.id}
                          >
                            <Trash2 className="h-3 w-3" />
                            {deleting === run.id ? "Удаление..." : "Удалить"}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Удалить результаты теста?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Это действие нельзя отменить. Все результаты теста #{run.id.slice(0, 8)} будут удалены
                              навсегда.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Отмена</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(run.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Удалить
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Запущен: {new Date(run.started_at).toLocaleString("ru-RU")}
                  </div>
                  {run.completed_at && (
                    <div className="text-sm text-muted-foreground">
                      Завершен: {new Date(run.completed_at).toLocaleString("ru-RU")}
                    </div>
                  )}
                  <div className="flex gap-4 mt-2 text-sm">
                    <span>Всего: {run.total_requests}</span>
                    <span className="text-green-600">Завершено: {run.completed_requests}</span>
                    <span className="text-red-600">Ошибок: {run.failed_requests}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
