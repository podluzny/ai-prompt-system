import { RegexTesterInterface } from "@/components/regex-tester-interface"

export default function RegexTesterPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Тестер регулярных выражений</h1>
        <p className="text-muted-foreground mt-2">
          Проверьте работу ключевых слов и regex паттернов на тестовом тексте
        </p>
      </div>

      <RegexTesterInterface />
    </div>
  )
}
