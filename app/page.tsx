import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Plus } from "lucide-react"

export default async function HomePage() {
  const supabase = await createClient()

  const { data: projects } = await supabase.from("projects").select("*").order("created_at", { ascending: false })

  // Fetch test runs count for each project
  const projectsWithTestCounts = await Promise.all(
    (projects || []).map(async (project) => {
      const { count } = await supabase
        .from("test_runs")
        .select("*", { count: "exact", head: true })
        .eq("project_id", project.id)

      return {
        ...project,
        testRunsCount: count || 0,
      }
    }),
  )

  return (
    <div className="min-h-screen bg-[#F9F9F9]">
      <header className="bg-white border-b border-[#D9D9D9]">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex items-center justify-between py-5">
            <div className="flex-1">
              <div className="text-left">
                <h1 className="font-bold tracking-tight text-[#031C3A] text-2xl text-[rgba(3,28,58,1)]">
                  AI Prompt Testing System
                </h1>
                <p className="text-[#031C3A]/70 mt-1 text-sm">Тестирование и анализ ответов различных AI моделей</p>
              </div>
            </div>
            <div className="hidden md:flex justify-end">
              <Link href="/projects/new">
                <Button size="lg" className="gap-2 bg-[#0A5CBA] text-white hover:bg-[#0A5CBA]/90">
                  <Plus className="h-5 w-5" />
                  Создать проект
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto py-8 px-4 max-w-7xl pb-24 md:pb-8">
        {projectsWithTestCounts.length === 0 ? (
          <Card className="border-dashed bg-white">
            <CardHeader className="text-center py-16">
              <CardTitle className="text-xl">Нет проектов</CardTitle>
              <CardDescription className="mt-2">Создайте первый проект для тестирования AI моделей</CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {projectsWithTestCounts.map((project) => (
              <Link key={project.id} href={`/projects/${project.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer h-full border-border/40 bg-white">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-xl line-clamp-1">{project.name}</CardTitle>
                    <CardDescription className="line-clamp-2 mt-2">
                      {project.description || "Без описания"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-baseline gap-6">
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-bold">{project.keywords?.length || 0}</span>
                          <span className="text-sm text-muted-foreground">ключевых слов</span>
                        </div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-bold">{project.ai_models?.length || 0}</span>
                          <span className="text-sm text-muted-foreground">AI моделей</span>
                        </div>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold">{project.testRunsCount}</span>
                        <span className="text-sm text-muted-foreground">результатов</span>
                      </div>
                    </div>

                    <div className="text-sm text-muted-foreground pt-2 border-t-0">
                      Создан: {new Date(project.created_at).toLocaleDateString("ru-RU")}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-[#D9D9D9] z-50">
        <Link href="/projects/new" className="block">
          <Button size="lg" className="w-full gap-2 bg-[#0A5CBA] text-white hover:bg-[#0A5CBA]/90">
            <Plus className="h-5 w-5" />
            Создать проект
          </Button>
        </Link>
      </div>
    </div>
  )
}
