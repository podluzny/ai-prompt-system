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
import { Loader2, Trash2 } from "lucide-react"
import type { Project } from "@/lib/types"
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

export function ProjectSettings({ project }: { project: Project }) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [formData, setFormData] = useState({
    name: project.name,
    description: project.description || "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const supabase = createClient()

      const { error } = await supabase
        .from("projects")
        .update({
          name: formData.name,
          description: formData.description,
          updated_at: new Date().toISOString(),
        })
        .eq("id", project.id)

      if (error) throw error

      alert("Проект обновлен")
      router.refresh()
    } catch (error) {
      console.error("Error updating project:", error)
      alert("Ошибка при обновлении проекта")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)

    try {
      const supabase = createClient()

      const { error } = await supabase.from("projects").delete().eq("id", project.id)

      if (error) throw error

      router.push("/")
    } catch (error) {
      console.error("Error deleting project:", error)
      alert("Ошибка при удалении проекта")
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card className="bg-white border border-[#D9D9D9] shadow-none">
        <CardHeader className="border-b border-[#D9D9D9] border-none pb-0">
          <CardTitle className="text-sm font-bold text-[#031C3A] uppercase tracking-wide">
            ОСНОВНАЯ ИНФОРМАЦИЯ
          </CardTitle>
          <CardDescription className="text-[#515151]">Редактируйте название и описание проекта</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-[#031C3A] font-medium">
                Название проекта
              </Label>
              <Input
                id="name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="border-[#D9D9D9]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-[#031C3A] font-medium">
                Описание проекта
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="border-[#D9D9D9]"
              />
            </div>

            <Button type="submit" disabled={isLoading} className="bg-[#676767] hover:bg-[#515151] text-white">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Сохранить
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="bg-[#FFF3EA] border border-[#D9D9D9] rounded-lg p-6 py-3 px-3">
        <div className="flex items-start gap-1">
          <div className="flex-shrink-0">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={isDeleting}
                  className="text-[#D77935] hover:text-[#D77935] hover:bg-[#FFE5D1] p-2 h-auto"
                >
                  <Trash2 className="h-5 w-5" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Вы уверены?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Это действие нельзя отменить. Проект и все его данные будут удалены навсегда.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Отмена</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                    Удалить проект
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
          <div className="flex-1">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button className="text-left w-full group cursor-pointer">
                  <div className="font-medium text-[#D77935] group-hover:underline mt-1.5">Удалить проект</div>
                  <div className="text-sm text-[#676767] mt-1">
                    Удаление проекта необратимо и удалит все связанные данные
                  </div>
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Вы уверены?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Это действие нельзя отменить. Проект и все его данные будут удалены навсегда.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Отмена</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive text-white">
                    Удалить проект
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>

      <div className="text-sm text-[#676767] space-y-1 pt-4 pl-0 pb-8">
        <p>Создан: {new Date(project.created_at).toLocaleString("ru-RU")}</p>
        <p>Обновлен: {new Date(project.updated_at).toLocaleString("ru-RU")}</p>
      </div>
    </div>
  )
}
