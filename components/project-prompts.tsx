"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import { Loader2, Plus, Trash2, GripVertical, FileText, Pencil, X, Check } from "lucide-react"
import type { Prompt } from "@/lib/types"

export function ProjectPrompts({ projectId, prompts, initialContent }: { projectId: string; prompts: Prompt[]; initialContent?: string | null }) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [newPrompt, setNewPrompt] = useState("")
  const [showContentInput, setShowContentInput] = useState(false)
  const [content, setContent] = useState(initialContent || "")
  const [isEditingContent, setIsEditingContent] = useState(false)
  const [isSavingContent, setIsSavingContent] = useState(false)

  const handleSaveContent = async () => {
    setIsSavingContent(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("projects")
        .update({ content: content.trim() || null, updated_at: new Date().toISOString() })
        .eq("id", projectId)

      if (error) throw error

      setShowContentInput(false)
      setIsEditingContent(false)
      router.refresh()
    } catch (error) {
      console.error("Error saving content:", error)
      alert("Ошибка при сохранении контента")
    } finally {
      setIsSavingContent(false)
    }
  }

  const handleDeleteContent = async () => {
    if (!confirm("Удалить контент?")) return
    
    setIsSavingContent(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("projects")
        .update({ content: null, updated_at: new Date().toISOString() })
        .eq("id", projectId)

      if (error) throw error

      setContent("")
      setShowContentInput(false)
      setIsEditingContent(false)
      router.refresh()
    } catch (error) {
      console.error("Error deleting content:", error)
      alert("Ошибка при удалении контента")
    } finally {
      setIsSavingContent(false)
    }
  }

  const handleAddPrompt = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPrompt.trim()) return

    setIsLoading(true)

    try {
      const supabase = createClient()
      const maxOrder = Math.max(...prompts.map((p) => p.order_index), 0)

      const { error } = await supabase.from("prompts").insert({
        project_id: projectId,
        text: newPrompt.trim(),
        order_index: maxOrder + 1,
      })

      if (error) throw error

      setNewPrompt("")
      router.refresh()
    } catch (error) {
      console.error("Error adding prompt:", error)
      alert("Ошибка при добавлении промпта")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeletePrompt = async (promptId: string) => {
    try {
      const supabase = createClient()

      const { error } = await supabase.from("prompts").delete().eq("id", promptId)

      if (error) throw error

      router.refresh()
    } catch (error) {
      console.error("Error deleting prompt:", error)
      alert("Ошибка при удалении промпта")
    }
  }

  return (
    <div className="space-y-6">
      {/* Content Section */}
      <Card className="shadow-none">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Контент</CardTitle>
              <CardDescription>Контент будет добавлен к каждому промпту при тестировании</CardDescription>
            </div>
            {!initialContent && !showContentInput && (
              <Button variant="outline" onClick={() => setShowContentInput(true)} className="cursor-pointer">
                <FileText className="mr-2 h-4 w-4" />
                Добавить контент
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {(showContentInput || initialContent) && (
            <div className="space-y-4">
              {isEditingContent || showContentInput ? (
                <>
                  <Textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Введите контент, который будет добавлен к промптам..."
                    rows={6}
                  />
                  <div className="flex gap-2">
                    <Button 
                      onClick={handleSaveContent} 
                      disabled={isSavingContent}
                      className="cursor-pointer"
                    >
                      {isSavingContent && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      <Check className="mr-2 h-4 w-4" />
                      Сохранить
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setShowContentInput(false)
                        setIsEditingContent(false)
                        setContent(initialContent || "")
                      }}
                      className="cursor-pointer"
                    >
                      <X className="mr-2 h-4 w-4" />
                      Отмена
                    </Button>
                  </div>
                </>
              ) : (
                <div className="p-4 border rounded-lg bg-muted/30">
                  <div className="flex items-start justify-between gap-4">
                    <p className="text-sm whitespace-pre-wrap break-words flex-1">{initialContent}</p>
                    <div className="flex gap-1 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsEditingContent(true)}
                        className="cursor-pointer"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleDeleteContent}
                        disabled={isSavingContent}
                        className="cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

        </CardContent>
      </Card>

      {/* Add Prompt Section */}
      <Card className="shadow-none">
        <CardHeader>
          <CardTitle>Добавить промпт</CardTitle>
          <CardDescription>Создайте новый промпт для отправки AI моделям</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddPrompt} className="space-y-4">
            <Textarea
              value={newPrompt}
              onChange={(e) => setNewPrompt(e.target.value)}
              placeholder="Введите текст промпта..."
              rows={3}
            />
            <Button type="submit" disabled={isLoading || !newPrompt.trim()} className="cursor-pointer">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Plus className="mr-2 h-4 w-4" />
              Добавить промпт
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="shadow-none">
        <CardHeader>
          <CardTitle>Список промптов ({prompts.length})</CardTitle>
          <CardDescription>Управляйте промптами для тестирования</CardDescription>
        </CardHeader>
        <CardContent>
          {prompts.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Пока нет промптов. Добавьте первый промпт выше.</p>
          ) : (
            <div className="space-y-3">
              {prompts.map((prompt, index) => (
                <div
                  key={prompt.id}
                  className="flex items-start gap-3 p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <GripVertical className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-1" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-muted-foreground mb-1">Промпт #{index + 1}</div>
                    <p className="text-sm whitespace-pre-wrap break-words">{prompt.text}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeletePrompt(prompt.id)}
                    className="flex-shrink-0"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
