"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Play, AlertCircle, Clock, Activity, RotateCcw } from "lucide-react"
import type { Project, Prompt } from "@/lib/types"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { useRouter } from "next/navigation"
import { TEST_CONFIG } from "@/lib/test-config"

interface TestProgress {
  testRunId: string
  status: string
  totalRequests: number
  completedRequests: number
  failedRequests: number
  currentModel?: string
  currentPrompt?: string
  elapsedTime: number
}

export function ProjectTestRunner({ project, prompts }: { project: Project; prompts: Prompt[] }) {
  const [isRunning, setIsRunning] = useState(false)
  const [progress, setProgress] = useState<TestProgress | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [enabledModels, setEnabledModels] = useState<Record<string, boolean>>({})
  const router = useRouter()

  const getModelKey = (model: (typeof project.ai_models)[0], index: number) => {
    return model.id || `${model.provider}-${model.model}-${index}`
  }

  useEffect(() => {
    const storageKey = `test-enabled-models-${project.id}`
    const stored = localStorage.getItem(storageKey)

    let initial: Record<string, boolean> = {}

    if (stored) {
      try {
        initial = JSON.parse(stored)
      } catch (e) {
        console.error("Failed to parse stored enabled models:", e)
      }
    }

    project.ai_models.forEach((model, index) => {
      const key = getModelKey(model, index)
      if (initial[key] === undefined) {
        initial[key] = true
      }
    })

    setEnabledModels(initial)
  }, [project.id, project.ai_models])

  useEffect(() => {
    if (Object.keys(enabledModels).length === 0) return

    const storageKey = `test-enabled-models-${project.id}`
    localStorage.setItem(storageKey, JSON.stringify(enabledModels))
  }, [enabledModels, project.id])

  const enabledModelsCount = Object.values(enabledModels).filter(Boolean).length
  const canRun = enabledModelsCount > 0 && prompts.length > 0
  const totalRequests = enabledModelsCount * prompts.length

  useEffect(() => {
    if (!isRunning || !progress?.testRunId) return

    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/test-progress/${progress.testRunId}`)
        if (!response.ok) return

        const data = await response.json()
        setProgress(data)

        if (data.status === "completed" || data.status === "failed" || data.status === "stopped") {
          setIsRunning(false)
          clearInterval(interval)
          router.refresh()
        }
      } catch (err) {
        console.error("Error fetching progress:", err)
      }
    }, 2000)

    return () => clearInterval(interval)
  }, [isRunning, progress?.testRunId, router])

  const handleRunTest = async () => {
    if (!canRun) return

    setIsRunning(true)
    setError(null)
    setProgress({
      testRunId: "",
      status: "starting",
      totalRequests,
      completedRequests: 0,
      failedRequests: 0,
      elapsedTime: 0,
    })

    try {
      const enabledModelIndices = project.ai_models
        .map((model, index) => ({ model, index, key: getModelKey(model, index) }))
        .filter(({ key }) => enabledModels[key])
        .map(({ index }) => index)

      const response = await fetch("/api/run-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: project.id,
          enabledModelIndices,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to start test")
      }

      setProgress((prev) => prev && { ...prev, testRunId: data.testRunId, status: "running" })
    } catch (error) {
      console.error("Error running test:", error)
      setError(error instanceof Error ? error.message : "Ошибка при запуске теста")
      setIsRunning(false)
      setProgress(null)
    }
  }

  const handleStopTest = async () => {
    if (!progress?.testRunId) return

    try {
      const response = await fetch("/api/stop-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testRunId: progress.testRunId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to stop test")
      }

      setIsRunning(false)
      setProgress((prev) => prev && { ...prev, status: "stopped" })
      router.refresh()
    } catch (error) {
      console.error("Error stopping test:", error)
      setError(error instanceof Error ? error.message : "Ошибка при остановке теста")
    }
  }

  const handleToggleModel = (modelKey: string) => {
    setEnabledModels((prev) => ({
      ...prev,
      [modelKey]: !prev[modelKey],
    }))
  }

  const handleResetModels = () => {
    const allEnabled: Record<string, boolean> = {}
    project.ai_models.forEach((model, index) => {
      allEnabled[getModelKey(model, index)] = true
    })
    setEnabledModels(allEnabled)
  }

  const progressPercentage = progress ? Math.round((progress.completedRequests / progress.totalRequests) * 100) : 0

  return (
    <div className="space-y-6 -mx-6">
      <Card className="bg-primary-foreground border-none shadow-none rounded-none">
        <CardHeader className="px-6">
          <CardTitle>Запуск тестирования</CardTitle>
          <CardDescription>Отправка промптов выбранным AI моделям и анализ результатов</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 px-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 border rounded-lg bg-white">
              <div className="text-2xl font-bold">{prompts.length}</div>
              <div className="text-sm text-muted-foreground">Промптов</div>
            </div>
            <div className="p-4 border rounded-lg bg-white">
              <div className="text-2xl font-bold">
                {enabledModelsCount} / {project.ai_models.length}
              </div>
              <div className="text-sm text-muted-foreground">AI моделей активно</div>
            </div>
            <div className="p-4 border rounded-lg bg-white">
              <div className="text-2xl font-bold">{totalRequests}</div>
              <div className="text-sm text-muted-foreground">Всего запросов</div>
            </div>
          </div>

          {project.ai_models.length > 0 && (
            <Card className="shadow-none">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">Выбор AI моделей для тестирования</CardTitle>
                    <CardDescription className="text-sm">
                      Отключите модели, которые не нужно использовать в текущем запуске
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleResetModels}
                    disabled={isRunning}
                    className="gap-2 bg-transparent"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Сбросить
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {project.ai_models.map((model, index) => {
                    const modelKey = getModelKey(model, index)
                    const isEnabled = enabledModels[modelKey] ?? true

                    return (
                      <div
                        key={modelKey}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="font-medium text-sm">{model.model}</div>
                          <div className="text-xs text-muted-foreground">
                            Провайдер: {model.provider || "AI Gateway"}
                          </div>
                        </div>
                        <Switch
                          checked={isEnabled}
                          onCheckedChange={() => handleToggleModel(modelKey)}
                          disabled={isRunning}
                        />
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {!canRun && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Невозможно запустить тест</AlertTitle>
              <AlertDescription>
                {prompts.length === 0 && "Добавьте хотя бы один промпт. "}
                {enabledModelsCount === 0 && "Включите хотя бы одну AI модель."}
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Ошибка</AlertTitle>
              <AlertDescription>
                {error}
                {error.includes("rate limits") && (
                  <div className="mt-2 text-sm">
                    <strong>Решение:</strong> Добавьте собственные API ключи в разделе "AI Модели" для неограниченного
                    доступа.
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          {isRunning && progress && (
            <Card className="border-primary">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Выполнение теста</CardTitle>
                  <Badge variant="secondary" className="gap-1">
                    <Activity className="h-3 w-3 animate-pulse" />
                    {progress.status === "running" ? "В процессе" : "Запуск..."}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Прогресс</span>
                    <span className="font-medium">
                      {progress.completedRequests} / {progress.totalRequests} ({progressPercentage}%)
                    </span>
                  </div>
                  <Progress value={progressPercentage} className="h-2" />
                </div>

                {progress.currentModel && (
                  <div className="p-3 bg-muted rounded-lg space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Activity className="h-4 w-4 text-primary" />
                      <span className="font-medium">Текущий запрос:</span>
                    </div>
                    <div className="text-sm space-y-1 ml-6">
                      <div>
                        <span className="text-muted-foreground">Модель:</span>{" "}
                        <span className="font-mono text-xs">{progress.currentModel}</span>
                      </div>
                      {progress.currentPrompt && (
                        <div>
                          <span className="text-muted-foreground">Промпт:</span>{" "}
                          <span className="text-xs">{progress.currentPrompt.substring(0, 60)}...</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-4 pt-2">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{progress.completedRequests}</div>
                    <div className="text-xs text-muted-foreground">Завершено</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{progress.failedRequests}</div>
                    <div className="text-xs text-muted-foreground">Ошибок</div>
                  </div>
                  <div className="text-center flex flex-col items-center">
                    <div className="flex items-center gap-1">
                      <Clock className="h-5 w-5" />
                      <div className="text-2xl font-bold">{Math.floor(progress.elapsedTime / 1000)}s</div>
                    </div>
                    <div className="text-xs text-muted-foreground">Время</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {!isRunning && progress && progress.status === "completed" && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Тест завершен</AlertTitle>
              <AlertDescription>
                Обработано {progress.completedRequests} из {progress.totalRequests} запросов. Ошибок:{" "}
                {progress.failedRequests}. Перейдите в раздел "Результаты" для просмотра.
              </AlertDescription>
            </Alert>
          )}

          {!isRunning && progress && progress.status === "stopped" && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Тест остановлен</AlertTitle>
              <AlertDescription>
                Обработано {progress.completedRequests} из {progress.totalRequests} запросов. Ошибок:{" "}
                {progress.failedRequests}. Частичные результаты доступны в разделе "Результаты".
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            {isRunning ? (
              <div className="grid grid-cols-2 gap-4">
                <Button onClick={handleRunTest} disabled size="lg" variant="secondary">
                  <Play className="mr-2 h-5 w-5" />
                  Тест выполняется...
                </Button>
                <Button onClick={handleStopTest} size="lg" variant="destructive">
                  <AlertCircle className="mr-2 h-5 w-5" />
                  Остановить тест
                </Button>
              </div>
            ) : (
              <Button onClick={handleRunTest} disabled={!canRun} size="lg" className="w-full">
                <Play className="mr-2 h-5 w-5" />
                Запустить тест
              </Button>
            )}
            <p className="text-xs text-muted-foreground text-center">
              {isRunning
                ? "Нажмите 'Остановить тест' для прерывания выполнения с сохранением текущих результатов"
                : "Тест будет выполнен с ограничением в 2 параллельных запроса"}
            </p>
          </div>

          <div className="text-sm text-muted-foreground space-y-1">
            <p>
              <strong>Процесс тестирования:</strong>
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Отправка всех промптов к выбранным AI моделям</li>
              <li>Максимум {TEST_CONFIG.MAX_CONCURRENT_REQUESTS} параллельных запроса</li>
              <li>
                При ошибке: {TEST_CONFIG.MAX_RETRY_ATTEMPTS}{" "}
                {TEST_CONFIG.MAX_RETRY_ATTEMPTS === 1 ? "попытка" : "попытки"} с задержкой{" "}
                {TEST_CONFIG.RETRY_DELAY_MS / 1000} секунд
              </li>
              <li>Анализ ответов на наличие ключевых слов и regex</li>
              <li>Сохранение результатов в базу данных</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
