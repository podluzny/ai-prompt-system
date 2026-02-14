"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import { Plus, Trash2, Search, ArrowUpDown } from "lucide-react"
import type { Project } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { KeywordTesterPanel } from "@/components/keyword-tester-panel"
import { KeywordOrderDialog } from "@/components/keyword-order-dialog"

export function ProjectKeywords({ project }: { project: Project }) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [newKeyword, setNewKeyword] = useState("")
  const [newRegex, setNewRegex] = useState("")
  const [testerOpen, setTesterOpen] = useState(false)
  const [orderDialogOpen, setOrderDialogOpen] = useState(false)

  const handleAddKeyword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newKeyword.trim()) return

    setIsLoading(true)

    try {
      const supabase = createClient()
      const updatedKeywords = [...project.keywords, newKeyword.trim()]

      const { error } = await supabase
        .from("projects")
        .update({
          keywords: updatedKeywords,
          updated_at: new Date().toISOString(),
        })
        .eq("id", project.id)

      if (error) throw error

      setNewKeyword("")
      router.refresh()
    } catch (error) {
      console.error("Error adding keyword:", error)
      alert("Ошибка при добавлении ключевого слова")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteKeyword = async (keyword: string) => {
    try {
      const supabase = createClient()
      const updatedKeywords = project.keywords.filter((k) => k !== keyword)

      const { error } = await supabase
        .from("projects")
        .update({
          keywords: updatedKeywords,
          updated_at: new Date().toISOString(),
        })
        .eq("id", project.id)

      if (error) throw error

      router.refresh()
    } catch (error) {
      console.error("Error deleting keyword:", error)
      alert("Ошибка при удалении ключевого слова")
    }
  }

  const handleAddRegex = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newRegex.trim()) return

    setIsLoading(true)

    try {
      const supabase = createClient()
      const updatedRegex = [...project.regex_patterns, newRegex.trim()]

      const { error } = await supabase
        .from("projects")
        .update({
          regex_patterns: updatedRegex,
          updated_at: new Date().toISOString(),
        })
        .eq("id", project.id)

      if (error) throw error

      setNewRegex("")
      router.refresh()
    } catch (error) {
      console.error("Error adding regex:", error)
      alert("Ошибка при добавлении регулярного выражения")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteRegex = async (regex: string) => {
    try {
      const supabase = createClient()
      const updatedRegex = project.regex_patterns.filter((r) => r !== regex)

      const { error } = await supabase
        .from("projects")
        .update({
          regex_patterns: updatedRegex,
          updated_at: new Date().toISOString(),
        })
        .eq("id", project.id)

      if (error) throw error

      router.refresh()
    } catch (error) {
      console.error("Error deleting regex:", error)
      alert("Ошибка при удалении регулярного выражения")
    }
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-none">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Ключевые слова</CardTitle>
              <CardDescription>Слова и термины для поиска в ответах AI моделей</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOrderDialogOpen(true)}
              disabled={project.keywords.length === 0 && project.regex_patterns.length === 0}
            >
              <ArrowUpDown className="h-4 w-4 mr-2" />
              Изменить порядок
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleAddKeyword} className="flex gap-2">
            <Input
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              placeholder="Добавить ключевое слово..."
            />
            <Button type="submit" disabled={isLoading || !newKeyword.trim()}>
              <Plus className="h-4 w-4" />
            </Button>
          </form>

          <div className="flex flex-wrap gap-2">
            {project.keywords.length === 0 ? (
              <p className="text-muted-foreground text-sm">Нет ключевых слов</p>
            ) : (
              project.keywords.map((keyword, index) => (
                <Badge key={`${keyword}-${index}`} variant="secondary" className="gap-2 leading-7 text-base font-normal">
                  {keyword}
                  <button
                    onClick={() => handleDeleteKeyword(keyword)}
                    className="hover:text-destructive cursor-pointer"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </Badge>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-none">
        <CardHeader>
          <CardTitle>Регулярные выражения</CardTitle>
          <CardDescription>Паттерны для продвинутого поиска в ответах</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleAddRegex} className="flex gap-2">
            <Input
              value={newRegex}
              onChange={(e) => setNewRegex(e.target.value)}
              placeholder="Добавить regex паттерн..."
              className="font-mono text-sm"
            />
            <Button type="submit" disabled={isLoading || !newRegex.trim()}>
              <Plus className="h-4 w-4" />
            </Button>
          </form>

          <div className="space-y-2">
            {project.regex_patterns.length === 0 ? (
              <p className="text-muted-foreground text-sm">Нет регулярных выражений</p>
            ) : (
              project.regex_patterns.map((regex, index) => (
                <div key={`${regex}-${index}`} className="flex items-center gap-2 p-2 border rounded-md">
                  <code className="flex-1 text-sm font-mono break-all">{regex}</code>
                  <Button variant="ghost" size="icon" onClick={() => handleDeleteRegex(regex)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-none border-solid">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Тестирование
          </CardTitle>
          <CardDescription>Проверьте работу ключевых слов и regex на тестовом тексте</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={() => setTesterOpen(true)}>
            Открыть тестер
          </Button>
        </CardContent>
      </Card>

      <KeywordTesterPanel
        open={testerOpen}
        onOpenChange={setTesterOpen}
        keywords={project.keywords}
        regexPatterns={project.regex_patterns}
      />

      <KeywordOrderDialog
        open={orderDialogOpen}
        onOpenChange={setOrderDialogOpen}
        projectId={project.id}
        initialKeywords={project.keywords}
        initialRegexPatterns={project.regex_patterns}
      />
    </div>
  )
}
