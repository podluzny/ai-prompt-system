"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import { Loader2 } from "lucide-react"

export function NewProjectForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const supabase = createClient()

      const { data, error } = await supabase
        .from("projects")
        .insert({
          user_id: "00000000-0000-0000-0000-000000000001",
          name: formData.name,
          description: formData.description,
          keywords: [],
          regex_patterns: [],
          ai_models: [
            { provider: "AI Gateway", model: "openai/gpt-4o-mini", apiKey: null },
            { provider: "AI Gateway", model: "anthropic/claude-3-5-haiku-latest", apiKey: null },
          ],
        })
        .select()
        .single()

      if (error) throw error

      router.push(`/projects/${data.id}`)
    } catch (error) {
      console.error("Error creating project:", error)
      alert("Ошибка при создании проекта")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Информация о проекте</CardTitle>
        <CardDescription>Введите название и описание проекта</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Название проекта *</Label>
            <Input
              id="name"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Мой AI проект"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Описание</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Краткое описание проекта..."
              rows={4}
            />
          </div>

          <div className="flex gap-4">
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Создать проект
            </Button>
            <Button type="button" variant="outline" onClick={() => router.push("/")}>
              Отмена
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
