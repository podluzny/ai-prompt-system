import { createClient } from "@/lib/supabase/server"
import { notFound, redirect } from "next/navigation"
import { ProjectSettings } from "@/components/project-settings"
import { ProjectPrompts } from "@/components/project-prompts"
import { ProjectKeywords } from "@/components/project-keywords"
import { ProjectAIModels } from "@/components/project-ai-models"
import { ProjectTestRunner } from "@/components/project-test-runner"
import { ProjectResults } from "@/components/project-results"
import { ProjectTabs } from "@/components/project-tabs"
import { NewProjectForm } from "@/components/new-project-form"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  
  // Handle "new" route - render new project form
  if (id === "new") {
    return (
      <div className="container mx-auto py-8 px-4 max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Создать новый проект</h1>
          <p className="text-muted-foreground mt-2">Заполните информацию о проекте для тестирования AI моделей</p>
        </div>
        <NewProjectForm />
      </div>
    )
  }
  
  // Validate UUID format before making database query
  // Simple UUID format check: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(id)) {
    notFound()
  }
  
  const supabase = await createClient()

  const { data: project } = await supabase.from("projects").select("*").eq("id", id).single()

  if (!project) {
    notFound()
  }

  const { data: prompts } = await supabase
    .from("prompts")
    .select("*")
    .eq("project_id", id)
    .order("order_index", { ascending: true })

  const { count: testRunsCount } = await supabase
    .from("test_runs")
    .select("*", { count: "exact", head: true })
    .eq("project_id", id)

  return (
    <div className="bg-primary-foreground border-none shadow-none">
      <header className="bg-white border-b border-[#D9D9D9]">
        <div className="container mx-auto px-6 py-5 max-w-7xl">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2 hover:bg-gray-50">
              <ArrowLeft className="h-4 w-4" />
              Назад к проектам
            </Button>
          </Link>
        </div>
      </header>

      <div className="border-b border-[#D9D9D9] border-none-[0]ry-foregroundry-foregrounder-foregrounderforegroundoundround border-none bg-primary-foreground">
        <div className="container mx-auto px-6 py-6 max-w-7xl">
          <h1 className="text-3xl font-bold text-[#031C3A]">{project.name}</h1>
          <p className="text-[#515151] mt-2">{project.description}</p>
        </div>
      </div>

      <div className="container mx-auto px-6 max-w-7xl py-0">
        <ProjectTabs
          projectId={id}
          promptsCount={prompts?.length || 0}
          resultsCount={testRunsCount || 0}
          children={{
            settings: <ProjectSettings project={project} />,
            prompts: <ProjectPrompts projectId={id} prompts={prompts || []} initialContent={project.content} />,
            keywords: <ProjectKeywords project={project} />,
            aiModels: <ProjectAIModels project={project} />,
            test: <ProjectTestRunner project={project} prompts={prompts || []} />,
            results: <ProjectResults projectId={id} />,
          }}
        />
      </div>
    </div>
  )
}
