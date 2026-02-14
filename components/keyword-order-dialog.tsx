"use client"

import type React from "react"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { GripVertical } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

interface KeywordOrderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
  initialKeywords: string[]
  initialRegexPatterns: string[]
}

export function KeywordOrderDialog({
  open,
  onOpenChange,
  projectId,
  initialKeywords,
  initialRegexPatterns,
}: KeywordOrderDialogProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [keywords, setKeywords] = useState<string[]>(initialKeywords)
  const [regexPatterns, setRegexPatterns] = useState<string[]>(initialRegexPatterns)
  const [draggedKeywordIndex, setDraggedKeywordIndex] = useState<number | null>(null)
  const [draggedRegexIndex, setDraggedRegexIndex] = useState<number | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      setKeywords(initialKeywords)
      setRegexPatterns(initialRegexPatterns)
    }
    onOpenChange(newOpen)
  }

  const handleKeywordDragStart = (index: number) => {
    setDraggedKeywordIndex(index)
  }

  const handleKeywordDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedKeywordIndex === null || draggedKeywordIndex === index) return

    const newKeywords = [...keywords]
    const draggedItem = newKeywords[draggedKeywordIndex]
    newKeywords.splice(draggedKeywordIndex, 1)
    newKeywords.splice(index, 0, draggedItem)

    setKeywords(newKeywords)
    setDraggedKeywordIndex(index)
  }

  const handleKeywordDragEnd = () => {
    setDraggedKeywordIndex(null)
  }

  const handleRegexDragStart = (index: number) => {
    setDraggedRegexIndex(index)
  }

  const handleRegexDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedRegexIndex === null || draggedRegexIndex === index) return

    const newRegex = [...regexPatterns]
    const draggedItem = newRegex[draggedRegexIndex]
    newRegex.splice(draggedRegexIndex, 1)
    newRegex.splice(index, 0, draggedItem)

    setRegexPatterns(newRegex)
    setDraggedRegexIndex(index)
  }

  const handleRegexDragEnd = () => {
    setDraggedRegexIndex(null)
  }

  const handleSave = async () => {
    setIsSaving(true)

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("projects")
        .update({
          keywords: keywords,
          regex_patterns: regexPatterns,
          updated_at: new Date().toISOString(),
        })
        .eq("id", projectId)

      if (error) throw error

      toast({
        title: "Порядок сохранен",
        description: "Новый порядок терминов успешно сохранен",
      })

      router.refresh()
      onOpenChange(false)
    } catch (error) {
      console.error("Error saving order:", error)
      toast({
        title: "Ошибка сохранения",
        description: "Не удалось сохранить новый порядок",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Управление порядком</DialogTitle>
          <DialogDescription>
            Перетаскивайте элементы для изменения порядка. Нажмите "Сохранить" для применения изменений.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="keywords" className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="keywords">Ключевые слова</TabsTrigger>
            <TabsTrigger value="regex">Регулярные выражения</TabsTrigger>
          </TabsList>

          <TabsContent value="keywords" className="flex-1 overflow-auto mt-4">
            <div className="space-y-2 pr-2">
              {keywords.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-8">Нет ключевых слов</p>
              ) : (
                keywords.map((keyword, index) => (
                  <div
                    key={`${keyword}-${index}`}
                    className="flex items-center gap-2 p-3 border rounded-md cursor-move hover:bg-accent/50 transition-colors"
                    draggable
                    onDragStart={() => handleKeywordDragStart(index)}
                    onDragOver={(e) => handleKeywordDragOver(e, index)}
                    onDragEnd={handleKeywordDragEnd}
                  >
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                    <Badge variant="secondary" className="text-sm">
                      {keyword}
                    </Badge>
                    <span className="text-xs text-muted-foreground ml-auto">#{index + 1}</span>
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="regex" className="flex-1 overflow-auto mt-4">
            <div className="space-y-2 pr-2">
              {regexPatterns.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-8">Нет регулярных выражений</p>
              ) : (
                regexPatterns.map((regex, index) => (
                  <div
                    key={`${regex}-${index}`}
                    className="flex items-center gap-2 p-3 border rounded-md cursor-move hover:bg-accent/50 transition-colors"
                    draggable
                    onDragStart={() => handleRegexDragStart(index)}
                    onDragOver={(e) => handleRegexDragOver(e, index)}
                    onDragEnd={handleRegexDragEnd}
                  >
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                    <code className="flex-1 text-sm font-mono break-all">{regex}</code>
                    <span className="text-xs text-muted-foreground">#{index + 1}</span>
                  </div>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Отмена
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Сохранение..." : "Сохранить"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
