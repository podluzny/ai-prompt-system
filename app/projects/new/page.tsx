import { NewProjectForm } from "@/components/new-project-form"

export default function NewProjectPage() {
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
