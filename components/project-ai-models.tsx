"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"
import { Loader2, Plus, Trash2, Brain, CheckCircle2, XCircle, Pencil } from "lucide-react"
import type { Project } from "@/lib/types"
import { Badge } from "@/components/ui/badge"

const AI_PROVIDERS = {
  "ai-gateway": {
    name: "AI Gateway (V0) ⚠️ Не работает в preview",
    models: [
      // OpenAI
      { value: "openai/gpt-5-mini", label: "GPT-5 Mini" },
      { value: "openai/gpt-5", label: "GPT-5" },
      { value: "openai/gpt-4o-mini", label: "GPT-4o Mini" },
      { value: "openai/gpt-4o", label: "GPT-4o" },
      { value: "openai/o3-mini", label: "O3 Mini" },

      // Anthropic
      { value: "anthropic/claude-sonnet-4.5", label: "Claude Sonnet 4.5" },
      { value: "anthropic/claude-haiku-4.5", label: "Claude Haiku 4.5" },
      { value: "anthropic/claude-3.5-sonnet", label: "Claude 3.5 Sonnet" },
      { value: "anthropic/claude-3.5-haiku", label: "Claude 3.5 Haiku" },

      // xAI
      { value: "xai/grok-4", label: "Grok 4" },
      { value: "xai/grok-3", label: "Grok 3" },
      { value: "xai/grok-beta", label: "Grok Beta" },

      // Google Gemini
      { value: "google/gemini-3-pro-preview", label: "Gemini 3 Pro Preview" },
      { value: "google/gemini-3-flash", label: "Gemini 3 Flash" },
      { value: "google/gemini-2.5-pro", label: "Gemini 2.5 Pro" },
      { value: "google/gemini-2.5-flash", label: "Gemini 2.5 Flash" },
      { value: "google/gemini-2.5-flash-lite", label: "Gemini 2.5 Flash Lite" },
      { value: "google/gemini-2.0-flash", label: "Gemini 2.0 Flash" },

      // Mistral
      { value: "mistral/mistral-large-3", label: "Mistral Large 3" },
      { value: "mistral/mistral-medium", label: "Mistral Medium" },
      { value: "mistral/mistral-small", label: "Mistral Small" },
      { value: "mistral/devstral-2", label: "Devstral 2" },
      { value: "mistral/codestral", label: "Codestral" },
      { value: "mistral/ministral-8b", label: "Ministral 8B" },

      // Alibaba Qwen
      { value: "alibaba/qwen3-max", label: "Qwen3 Max" },
      { value: "alibaba/qwen3-235b-a22b-thinking", label: "Qwen3 235B Thinking" },
      { value: "alibaba/qwen-3-235b", label: "Qwen 3 235B" },
      { value: "alibaba/qwen3-next-80b-a3b-instruct", label: "Qwen3 Next 80B" },
      { value: "alibaba/qwen-3-32b", label: "Qwen 3 32B" },
      { value: "alibaba/qwen-3-14b", label: "Qwen 3 14B" },
      { value: "alibaba/qwen3-coder", label: "Qwen3 Coder" },

      // Meta Llama
      { value: "meta/llama-4-maverick", label: "Llama 4 Maverick" },
      { value: "meta/llama-4-scout", label: "Llama 4 Scout" },
      { value: "meta/llama-3.3-70b", label: "Llama 3.3 70B" },
      { value: "meta/llama-3.1-70b", label: "Llama 3.1 70B" },
      { value: "meta/llama-3.1-8b", label: "Llama 3.1 8B" },

      // DeepSeek
      { value: "deepseek/deepseek-v3.2", label: "DeepSeek V3.2" },
      { value: "deepseek/deepseek-r1", label: "DeepSeek R1" },
    ],
    requiresApiKey: false,
    notice: "AI Gateway недоступен в v0 preview. Используйте провайдеров OpenAI, DeepSeek или Yandex AI с собственными API ключами.",
  },
  openai: {
    name: "OpenAI",
    models: [
      { value: "gpt-4o-mini", label: "GPT-4o Mini" },
      { value: "gpt-4o", label: "GPT-4o" },
      { value: "gpt-4-turbo", label: "GPT-4 Turbo" },
      { value: "gpt-3.5-turbo", label: "GPT-3.5 Turbo" },
    ],
    requiresApiKey: true,
  },
  anthropic: {
    name: "Anthropic",
    models: [
      { value: "claude-3-5-haiku-latest", label: "Claude 3.5 Haiku" },
      { value: "claude-3-5-sonnet-latest", label: "Claude 3.5 Sonnet" },
      { value: "claude-3-opus-latest", label: "Claude 3 Opus" },
    ],
    requiresApiKey: true,
  },
  deepseek: {
    name: "DeepSeek",
    models: [
      { value: "deepseek-chat", label: "DeepSeek Chat" },
      { value: "deepseek-reasoner", label: "DeepSeek Reasoner" },
      { value: "deepseek/deepseek-v3.2", label: "DeepSeek V3.2" },
      { value: "deepseek/deepseek-r1", label: "DeepSeek R1" },
    ],
    requiresApiKey: true,
    baseURL: "https://api.deepseek.com",
  },
  "yandex-ai": {
    name: "Yandex AI",
    models: [
      { value: "aliceai-llm/latest", label: "AliceAI LLM Latest" },
      { value: "yandexgpt/latest", label: "YandexGPT Latest" },
      { value: "yandexgpt-lite/latest", label: "YandexGPT Lite" },
    ],
    requiresApiKey: true,
    requiresFolderId: true,
  },
  custom: {
    name: "Custom (другой провайдер)",
    models: [],
    requiresApiKey: true,
  },
}

export function ProjectAIModels({ project }: { project: Project }) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [testingIndex, setTestingIndex] = useState<number | null>(null)
  const [testResults, setTestResults] = useState<Record<number, { status: string; message: string }>>({})
  const [newModel, setNewModel] = useState({
    provider: "",
    model: "",
    apiKey: "",
    folderId: "",
    baseURL: "",
  })

  const selectedProvider = AI_PROVIDERS[newModel.provider as keyof typeof AI_PROVIDERS]
  const availableModels = selectedProvider?.models || []

  const handleStartEdit = (index: number) => {
    const model = project.ai_models[index]
    setNewModel({
      provider: model.provider || "",
      model: model.model || "",
      apiKey: model.apiKey || "",
      folderId: model.folderId || "",
      baseURL: model.baseURL || "",
    })
    setEditingIndex(index)
    setIsAdding(false)
  }

  const handleUpdateModel = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editingIndex === null) return
    if (!newModel.provider.trim() || !newModel.model.trim()) return

    if (newModel.provider === "yandex-ai" && !newModel.folderId.trim()) {
      alert("Для Yandex AI требуется указать Folder ID")
      return
    }

    setIsLoading(true)

    try {
      const supabase = createClient()
      const modelData: any = {
        provider: newModel.provider.trim(),
        model: newModel.model.trim(),
      }

      if (selectedProvider?.requiresApiKey && newModel.apiKey.trim()) {
        modelData.apiKey = newModel.apiKey.trim()
      }

      if (newModel.provider === "yandex-ai") {
        modelData.folderId = newModel.folderId.trim()
        modelData.baseURL = "https://rest-assistant.api.cloud.yandex.net/v1"
      }

      if (newModel.provider === "deepseek") {
        modelData.baseURL = AI_PROVIDERS.deepseek.baseURL
      }

      if (newModel.provider === "custom" && newModel.baseURL.trim()) {
        modelData.baseURL = newModel.baseURL.trim()
      }

      const ai_models = [...project.ai_models]
      ai_models[editingIndex] = modelData

      const { error } = await supabase
        .from("projects")
        .update({
          ai_models,
          updated_at: new Date().toISOString(),
        })
        .eq("id", project.id)

      if (error) throw error

      setNewModel({ provider: "", model: "", apiKey: "", folderId: "", baseURL: "" })
      setEditingIndex(null)
      router.refresh()
    } catch (error) {
      console.error("Error updating AI model:", error)
      alert("Ошибка при обновлении AI модели")
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddModel = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newModel.provider.trim() || !newModel.model.trim()) return

    if (newModel.provider === "yandex-ai" && !newModel.folderId.trim()) {
      alert("Для Yandex AI требуется указать Folder ID")
      return
    }

    setIsLoading(true)

    try {
      const supabase = createClient()
      const modelData: any = {
        provider: newModel.provider.trim(),
        model: newModel.model.trim(),
      }

      if (selectedProvider?.requiresApiKey && newModel.apiKey.trim()) {
        modelData.apiKey = newModel.apiKey.trim()
      }

      if (newModel.provider === "yandex-ai") {
        modelData.folderId = newModel.folderId.trim()
        modelData.baseURL = "https://rest-assistant.api.cloud.yandex.net/v1"
      }

      if (newModel.provider === "deepseek") {
        modelData.baseURL = AI_PROVIDERS.deepseek.baseURL
      }

      if (newModel.provider === "custom" && newModel.baseURL.trim()) {
        modelData.baseURL = newModel.baseURL.trim()
      }

      const ai_models = [...project.ai_models, modelData]

      const { error } = await supabase
        .from("projects")
        .update({
          ai_models,
          updated_at: new Date().toISOString(),
        })
        .eq("id", project.id)

      if (error) throw error

      setNewModel({ provider: "", model: "", apiKey: "", folderId: "", baseURL: "" })
      setIsAdding(false)
      router.refresh()
    } catch (error) {
      console.error("Error adding AI model:", error)
      alert("Ошибка при добавлении AI модели")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteModel = async (index: number) => {
    try {
      const supabase = createClient()
      const ai_models = project.ai_models.filter((_, i) => i !== index)

      const { error } = await supabase
        .from("projects")
        .update({
          ai_models,
          updated_at: new Date().toISOString(),
        })
        .eq("id", project.id)

      if (error) throw error

      router.refresh()
    } catch (error) {
      console.error("Error deleting AI model:", error)
      alert("Ошибка при удалении AI модели")
    }
  }

  const handleTestConnection = async (index: number) => {
    const model = project.ai_models[index]
    setTestingIndex(index)

    try {
      const response = await fetch("/api/test-connection", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(model),
      })

      const result = await response.json()
      setTestResults((prev) => ({
        ...prev,
        [index]: {
          status: result.status,
          message: result.message,
        },
      }))

      setTimeout(() => {
        setTestResults((prev) => {
          const updated = { ...prev }
          delete updated[index]
          return updated
        })
      }, 5000)
    } catch (error: any) {
      setTestResults((prev) => ({
        ...prev,
        [index]: {
          status: "ERROR",
          message: error.message || "Ошибка при проверке подключения",
        },
      }))
    } finally {
      setTestingIndex(null)
    }
  }

  return (
    <div className="space-y-6 -mx-6">
      <Card className="bg-primary-foreground border-none shadow-none rounded-none">
        <CardHeader className="px-6">
          <CardTitle>Выбранные AI модели</CardTitle>
          <CardDescription>Модели, которые будут использоваться для тестирования</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 px-6">
          {project.ai_models.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Нет выбранных моделей</p>
          ) : (
            <div className="space-y-3">
              {project.ai_models.map((model: any, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg bg-white">
                  <div className="flex items-center gap-3 flex-1">
                    <Brain className="h-5 w-5 text-muted-foreground" />
                    <div className="flex-1">
                      <div className="font-medium">{model.model}</div>
                      <div className="text-sm text-muted-foreground flex items-center gap-2">
                        {AI_PROVIDERS[model.provider as keyof typeof AI_PROVIDERS]?.name || model.provider}
                        {model.apiKey && (
                          <Badge variant="outline" className="text-xs">
                            Custom API
                          </Badge>
                        )}
                        {model.folderId && (
                          <Badge variant="outline" className="text-xs">
                            Folder: {model.folderId}
                          </Badge>
                        )}
                      </div>
                      {testResults[index] && (
                        <div
                          className={`mt-2 text-xs flex items-center gap-2 ${
                            testResults[index].status === "OK" ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {testResults[index].status === "OK" ? (
                            <CheckCircle2 className="h-4 w-4" />
                          ) : (
                            <XCircle className="h-4 w-4" />
                          )}
                          <span>{testResults[index].message}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTestConnection(index)}
                      disabled={testingIndex === index}
                    >
                      {testingIndex === index ? (
                        <>
                          <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                          Проверка...
                        </>
                      ) : (
                        "Проверить"
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleStartEdit(index)}
                      disabled={editingIndex !== null || isAdding}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteModel(index)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!isAdding && editingIndex === null && (
            <Button onClick={() => setIsAdding(true)} variant="outline" className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              Добавить модель
            </Button>
          )}
        </CardContent>
      </Card>

      {(isAdding || editingIndex !== null) && (
        <Card className="mx-6">
          <CardHeader>
            <CardTitle>{editingIndex !== null ? "Редактировать AI модель" : "Добавить AI модель"}</CardTitle>
            <CardDescription>Выберите провайдера и модель для тестирования</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={editingIndex !== null ? handleUpdateModel : handleAddModel} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="provider">Провайдер *</Label>
                <Select
                  value={newModel.provider}
                  onValueChange={(value) => setNewModel({ ...newModel, provider: value, model: "" })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Выберите провайдера" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(AI_PROVIDERS).map(([key, provider]) => (
                      <SelectItem key={key} value={key}>
                        {provider.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedProvider?.notice && (
                  <div className="flex items-start gap-2 p-3 text-sm bg-orange-50 border border-orange-200 rounded-md">
                    <XCircle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                    <p className="text-orange-900">{selectedProvider.notice}</p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="model">Модель *</Label>
                {availableModels.length > 0 ? (
                  <Select
                    value={newModel.model}
                    onValueChange={(value) => setNewModel({ ...newModel, model: value })}
                    disabled={!newModel.provider}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Выберите модель" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableModels.map((model) => (
                        <SelectItem key={model.value} value={model.value}>
                          {model.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    id="model"
                    required
                    value={newModel.model}
                    onChange={(e) => setNewModel({ ...newModel, model: e.target.value })}
                    placeholder="Введите название модели"
                    disabled={!newModel.provider}
                  />
                )}
              </div>

              {selectedProvider?.requiresApiKey && (
                <div className="space-y-2">
                  <Label htmlFor="apiKey">API ключ {newModel.provider === "ai-gateway" ? "(опционально)" : "*"}</Label>
                  <Input
                    id="apiKey"
                    type="password"
                    value={newModel.apiKey}
                    onChange={(e) => setNewModel({ ...newModel, apiKey: e.target.value })}
                    placeholder="Ваш API ключ"
                    required={newModel.provider !== "ai-gateway"}
                  />
                  {newModel.provider === "ai-gateway" && (
                    <p className="text-xs text-muted-foreground">Оставьте пустым для использования Vercel AI Gateway</p>
                  )}
                </div>
              )}

              {newModel.provider === "yandex-ai" && (
                <div className="space-y-2">
                  <Label htmlFor="folderId">Yandex Cloud Folder ID *</Label>
                  <Input
                    id="folderId"
                    required
                    value={newModel.folderId}
                    onChange={(e) => setNewModel({ ...newModel, folderId: e.target.value })}
                    placeholder="b1gcl5nakm97en52mk17"
                  />
                  <p className="text-xs text-muted-foreground">Найдите Folder ID в консоли Yandex Cloud</p>
                </div>
              )}

              {newModel.provider === "deepseek" && (
                <div className="space-y-2">
                  <Label htmlFor="baseURL">Base URL</Label>
                  <Input
                    id="baseURL"
                    value={newModel.baseURL}
                    onChange={(e) => setNewModel({ ...newModel, baseURL: e.target.value })}
                    placeholder="https://api.deepseek.com"
                  />
                  <p className="text-xs text-muted-foreground">URL эндпоинта для DeepSeek</p>
                </div>
              )}

              {newModel.provider === "custom" && (
                <div className="space-y-2">
                  <Label htmlFor="baseURL">Base URL</Label>
                  <Input
                    id="baseURL"
                    value={newModel.baseURL}
                    onChange={(e) => setNewModel({ ...newModel, baseURL: e.target.value })}
                    placeholder="https://api.example.com/v1"
                  />
                  <p className="text-xs text-muted-foreground">URL эндпоинта для кастомного провайдера</p>
                </div>
              )}

              <div className="flex gap-2">
                <Button type="submit" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingIndex !== null ? "Сохранить" : "Добавить"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsAdding(false)
                    setEditingIndex(null)
                    setNewModel({ provider: "", model: "", apiKey: "", folderId: "", baseURL: "" })
                  }}
                >
                  Отмена
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card className="shadow-none border-none bg-primary-foreground">
        <CardHeader>
          <CardTitle className="text-sm">Доступные провайдеры</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-3">
          <div>
            <strong>AI Gateway (V0):</strong>
            <p className="text-muted-foreground text-xs">Не требует API ключа, работает через Vercel AI Gateway</p>
          </div>
          <div>
            <strong>OpenAI, Anthropic:</strong>
            <p className="text-muted-foreground text-xs">Требуется API ключ от соответствующего провайдера</p>
          </div>
          <div>
            <strong>Yandex AI:</strong>
            <p className="text-muted-foreground text-xs">Требуется API ключ и Folder ID из Yandex Cloud</p>
          </div>
          <div>
            <strong>DeepSeek:</strong>
            <p className="text-muted-foreground text-xs">Требуется API ключ и Base URL для DeepSeek</p>
          </div>
          <div>
            <strong>Custom:</strong>
            <p className="text-muted-foreground text-xs">Для других провайдеров с OpenAI-совместимым API</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
