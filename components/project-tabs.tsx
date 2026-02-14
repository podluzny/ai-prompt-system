"use client"

import type React from "react"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useSearchParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"

interface ProjectTabsProps {
  projectId: string
  promptsCount: number
  resultsCount: number
  children: {
    settings: React.ReactNode
    prompts: React.ReactNode
    keywords: React.ReactNode
    aiModels: React.ReactNode
    test: React.ReactNode
    results: React.ReactNode
  }
}

export function ProjectTabs({ projectId, promptsCount, resultsCount, children }: ProjectTabsProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("settings")

  useEffect(() => {
    const tab = searchParams.get("tab")
    if (tab) {
      setActiveTab(tab)
    }
  }, [searchParams])

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    router.push(`/projects/${projectId}?tab=${value}`, { scroll: false })
  }

  const tabs = [
    { value: "settings", label: "Настройки", count: 0 },
    { value: "prompts", label: "Промпты", count: promptsCount },
    { value: "keywords", label: "Ключевые слова", count: 0 },
    { value: "ai-models", label: "AI модели", count: 0 },
    { value: "test", label: "Запуск теста", count: 0 },
    { value: "results", label: "Результаты", count: resultsCount },
  ]

  const currentTabLabel = tabs.find((tab) => tab.value === activeTab)?.label || "Настройки"

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
      <TabsList className="hidden md:flex w-full justify-start bg-[#ECECEE] rounded-lg p-1 h-auto">
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.value}
            value={tab.value}
            className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md px-6 py-2.5 text-[#515151] data-[state=active]:text-[#031C3A] font-medium"
          >
            {tab.label}{" "}
            {tab.count > 0 && (
              <span className="ml-1.5 text-[#515151] border border-secondary px-1.5 rounded-sm bg-sidebar-ring border-none text-sidebar-primary-foreground">
                {tab.count}
              </span>
            )}
          </TabsTrigger>
        ))}
      </TabsList>

      <div className="md:hidden w-full mb-4">
        <Select value={activeTab} onValueChange={handleTabChange}>
          <SelectTrigger className="w-full h-12 text-base font-medium">
            <SelectValue placeholder={currentTabLabel} />
          </SelectTrigger>
          <SelectContent>
            {tabs.map((tab) => (
              <SelectItem key={tab.value} value={tab.value} className="text-base py-3">
                {tab.label} {tab.count > 0 && `(${tab.count})`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="mt-6">
        <TabsContent value="settings" className="mt-0">
          {children.settings}
        </TabsContent>
        <TabsContent value="prompts" className="mt-0">
          {children.prompts}
        </TabsContent>
        <TabsContent value="keywords" className="mt-0">
          {children.keywords}
        </TabsContent>
        <TabsContent value="ai-models" className="mt-0">
          {children.aiModels}
        </TabsContent>
        <TabsContent value="test" className="mt-0">
          {children.test}
        </TabsContent>
        <TabsContent value="results" className="mt-0">
          {children.results}
        </TabsContent>
      </div>
    </Tabs>
  )
}
