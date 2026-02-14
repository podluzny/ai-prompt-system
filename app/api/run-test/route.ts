import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { generateText } from "ai"
import { TEST_CONFIG } from "@/lib/test-config"

export async function POST(request: Request) {
  try {
    const { projectId, enabledModelIndices } = await request.json()

    const supabase = await createClient()

    const { data: project } = await supabase.from("projects").select("*").eq("id", projectId).single()

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    const modelsToTest =
      enabledModelIndices && Array.isArray(enabledModelIndices)
        ? project.ai_models.filter((_: any, index: number) => enabledModelIndices.includes(index))
        : project.ai_models

    if (!modelsToTest || modelsToTest.length === 0) {
      return NextResponse.json({ error: "No AI models selected" }, { status: 400 })
    }

    const { data: prompts } = await supabase
      .from("prompts")
      .select("*")
      .eq("project_id", projectId)
      .order("order_index")

    if (!prompts || prompts.length === 0) {
      return NextResponse.json({ error: "No prompts found" }, { status: 400 })
    }

    const totalRequests = modelsToTest.length * prompts.length

    const { data: testRun, error: testRunError } = await supabase
      .from("test_runs")
      .insert({
        project_id: projectId,
        status: "running",
        total_requests: totalRequests,
        completed_requests: 0,
        failed_requests: 0,
      })
      .select()
      .single()

    if (testRunError) throw testRunError

    processTestRun(testRun.id, { ...project, ai_models: modelsToTest }, prompts)

    return NextResponse.json({
      success: true,
      testRunId: testRun.id,
      message: "Test started successfully",
    })
  } catch (error) {
    console.error("Error starting test:", error)
    return NextResponse.json({ error: "Failed to start test" }, { status: 500 })
  }
}

async function processTestRun(testRunId: string, project: any, prompts: any[]) {
  const supabase = await createClient()

  let shouldContinue = true
  const queue: Array<() => Promise<void>> = []

  let running = 0
  const maxConcurrent = TEST_CONFIG.MAX_CONCURRENT_REQUESTS

  for (const model of project.ai_models) {
    for (const prompt of prompts) {
      queue.push(async () => {
        const { data: testRun } = await supabase.from("test_runs").select("status").eq("id", testRunId).single()

        if (testRun?.status === "stopped") {
          shouldContinue = false
          return
        }

        await processRequest(supabase, testRunId, model, prompt, project)
      })
    }
  }

  const processNext = async () => {
    if (!shouldContinue) return

    if (queue.length === 0 && running === 0) {
      const { data: testRun } = await supabase.from("test_runs").select("status").eq("id", testRunId).single()
      if (testRun?.status !== "stopped") {
        await supabase
          .from("test_runs")
          .update({ status: "completed", completed_at: new Date().toISOString() })
          .eq("id", testRunId)
      }
      return
    }

    if (running >= maxConcurrent || queue.length === 0) return

    const task = queue.shift()
    if (!task) return

    running++
    try {
      await task()
    } finally {
      running--
      processNext()
    }
  }

  for (let i = 0; i < maxConcurrent; i++) processNext()
}

async function processRequest(
  supabase: any,
  testRunId: string,
  model: any,
  prompt: any,
  project: any,
  attemptCount = 0,
) {
  const maxAttempts = TEST_CONFIG.MAX_RETRY_ATTEMPTS
  const retryDelay = TEST_CONFIG.RETRY_DELAY_MS
  const requestTimeout = TEST_CONFIG.REQUEST_TIMEOUT_MS

  const controller = new AbortController()
  let timeoutId: NodeJS.Timeout | null = null

  // Build the full prompt text with content if available
  const fullPromptText = project.content 
    ? `${prompt.text}\n\nИспользуй контент:\n${project.content}`
    : prompt.text

  try {
    const startTime = Date.now()
    let text = ""

    const modelName = typeof model.model === "string" ? model.model : "deepseek-chat"

    const setupTimeout = () => {
      timeoutId = setTimeout(() => {
        console.log(`[v0] ⏱️ Request timeout after ${requestTimeout / 1000} seconds`)
        controller.abort()
      }, requestTimeout)
    }

    const cleanupTimeout = () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
        timeoutId = null
      }
    }

    function extractYandexText(data: any): string {
      if (!Array.isArray(data?.output)) return ""
      const chunks: string[] = []
      for (const message of data.output) {
        if (!Array.isArray(message?.content)) continue
        for (const part of message.content) {
          if (part?.type === "output_text" && typeof part.text === "string") {
            chunks.push(part.text)
          }
        }
      }
      return chunks.join("\n").trim()
    }

    if (model.provider === "yandex-ai") {
      const url = "https://rest-assistant.api.cloud.yandex.net/v1/responses"
      const requestBody = {
        model: `gpt://${model.folderId}/${modelName}`,
        input: fullPromptText,
        temperature: 0.3,
        max_output_tokens: 2000,
      }

      console.log("[v0] ========== YANDEX AI REQUEST ==========")
      console.log("[v0] URL:", url)
      console.log("[v0] Method: POST")
      console.log("[v0] Headers:", {
        "Content-Type": "application/json",
        Authorization: `Bearer ${model.apiKey?.slice(0, 10)}...`,
        "OpenAI-Project": model.folderId,
      })
      console.log("[v0] Request Body:", JSON.stringify(requestBody, null, 2))
      console.log("[v0] Timeout:", `${requestTimeout / 1000} seconds`)

      setupTimeout()

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${model.apiKey}`,
          "OpenAI-Project": model.folderId,
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      })

      cleanupTimeout()

      const responseText = await response.text()
      console.log("[v0] Response Status:", response.status)
      console.log("[v0] Response Headers:", JSON.stringify(Object.fromEntries(response.headers.entries())))
      console.log("[v0] Response Body (raw):", responseText)

      if (!response.ok) {
        console.log("[v0] ❌ Yandex AI request failed")
        console.log("[v0] ==========================================")
        throw new Error(`Yandex AI error: ${response.status} ${responseText}`)
      }

      let data
      try {
        data = JSON.parse(responseText)
        console.log("[v0] Parsed JSON successfully:", JSON.stringify(data, null, 2))
      } catch (parseError) {
        console.log("[v0] ❌ Failed to parse JSON:", parseError)
        console.log("[v0] ==========================================")
        throw new Error(`Failed to parse Yandex AI response: ${parseError}`)
      }

      text = extractYandexText(data) || "пустой ответ"

      console.log("[v0] Extracted text:", text)
      console.log("[v0] ✅ Yandex AI request successful")
      console.log("[v0] ==========================================")
    } else if (model.provider === "deepseek") {
      const url = "https://api.deepseek.com/v1/chat/completions"
      const requestBody = {
        model: "deepseek-chat",
        messages: [{ role: "user", content: fullPromptText }],
        max_tokens: 500,
        temperature: 0.7,
      }

      console.log("[v0] ========== DEEPSEEK REQUEST ==========")
      console.log("[v0] URL:", url)
      console.log("[v0] Method: POST")
      console.log("[v0] Headers:", {
        "Content-Type": "application/json",
        Authorization: `Bearer ${model.apiKey?.slice(0, 10)}...`,
      })
      console.log("[v0] Request Body:", JSON.stringify(requestBody, null, 2))
      console.log("[v0] Timeout:", `${requestTimeout / 1000} seconds`)

      setupTimeout()

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${model.apiKey}`,
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      })

      cleanupTimeout()

      const responseText = await response.text()
      console.log("[v0] Response Status:", response.status)
      console.log("[v0] Response Body:", responseText)

      if (!response.ok) {
        console.log("[v0] ❌ DeepSeek request failed")
        console.log("[v0] ==========================================")
        throw new Error(`DeepSeek error: ${response.status} ${responseText}`)
      }

      const data = JSON.parse(responseText)
      text = data.choices?.[0]?.message?.content ?? ""
      console.log("[v0] Extracted text:", text)
      console.log("[v0] ✅ DeepSeek request successful")
      console.log("[v0] ==========================================")
    } else if (model.provider === "openai" && model.apiKey) {
      // Direct OpenAI API call when API key is provided
      const url = "https://api.openai.com/v1/chat/completions"
      const requestBody = {
        model: modelName,
        messages: [{ role: "user", content: fullPromptText }],
        max_tokens: 1000,
        temperature: 0.7,
      }

      console.log("[v0] ========== OPENAI DIRECT REQUEST ==========")
      console.log("[v0] URL:", url)
      console.log("[v0] Model:", modelName)
      console.log("[v0] Headers:", {
        "Content-Type": "application/json",
        Authorization: `Bearer ${model.apiKey?.slice(0, 10)}...`,
      })
      console.log("[v0] Request Body:", JSON.stringify(requestBody, null, 2))
      console.log("[v0] Timeout:", `${requestTimeout / 1000} seconds`)

      setupTimeout()

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${model.apiKey}`,
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      })

      cleanupTimeout()

      const responseText = await response.text()
      console.log("[v0] Response Status:", response.status)
      console.log("[v0] Response Body:", responseText)

      if (!response.ok) {
        console.log("[v0] ❌ OpenAI request failed")
        console.log("[v0] ==========================================")
        throw new Error(`OpenAI error: ${response.status} ${responseText}`)
      }

      const data = JSON.parse(responseText)
      text = data.choices?.[0]?.message?.content ?? ""
      console.log("[v0] Extracted text:", text)
      console.log("[v0] ✅ OpenAI request successful")
      console.log("[v0] ==========================================")
    } else {
      console.log("[v0] ========== AI SDK REQUEST (Gateway) ==========")
      console.log("[v0] Model:", modelName)
      console.log("[v0] Prompt:", fullPromptText)
      console.log("[v0] Attempt:", attemptCount + 1, "of", maxAttempts)
      console.log("[v0] Timeout:", `${requestTimeout / 1000} seconds`)

      setupTimeout()

      const { text: responseText } = await generateText({
        model: modelName,
        prompt: fullPromptText,
        abortSignal: controller.signal,
      })

      cleanupTimeout()

      text = responseText
      console.log("[v0] Response Text:", responseText)
      console.log("[v0] ✅ AI SDK request successful")
      console.log("[v0] ==========================================")
    }

    const responseTime = Date.now() - startTime

    const keywordsFound: Record<string, number> = {}
    const regexMatches: Record<string, number> = {}

    project.keywords.forEach((k: string) => {
      const m = text.match(new RegExp(k, "gi"))
      keywordsFound[k] = m ? m.length : 0
    })

    project.regex_patterns.forEach((p: string) => {
      try {
        const m = text.match(new RegExp(p, "gi"))
        regexMatches[p] = m ? m.length : 0
      } catch {
        regexMatches[p] = 0
      }
    })

    const total = project.keywords.length + project.regex_patterns.length
    const found =
      Object.values(keywordsFound).filter(Boolean).length + Object.values(regexMatches).filter(Boolean).length

    await supabase.from("ai_responses").insert({
      test_run_id: testRunId,
      prompt_id: prompt.id,
      ai_model: model.model,
      request_text: fullPromptText,
      response_text: text,
      status: "success",
      attempt_count: attemptCount + 1,
      keywords_found: keywordsFound,
      regex_matches: regexMatches,
      match_percentage: total ? Math.round((found / total) * 10000) / 100 : 0,
      response_time_ms: responseTime,
    })

    await supabase.rpc("increment_completed", { test_run_id: testRunId })
  } catch (error) {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    const message = error instanceof Error ? error.message : "Unknown error"

    const isTimeout =
      (error instanceof Error && error.name === "AbortError") ||
      message.includes("timeout") ||
      message.includes("aborted")

    if (isTimeout) {
      console.log(`[v0] ⏱️ Request timed out after ${requestTimeout / 1000} seconds`)
    }

    console.log(`[v0] Error processing request (attempt ${attemptCount + 1}):`, message)

    if (!isTimeout && attemptCount < maxAttempts - 1) {
      console.log(`[v0] Retrying in ${retryDelay / 1000} seconds...`)
      await new Promise((r) => setTimeout(r, retryDelay))
      return processRequest(supabase, testRunId, model, prompt, project, attemptCount + 1)
    }

    await supabase.from("ai_responses").insert({
      test_run_id: testRunId,
      prompt_id: prompt.id,
      ai_model: model.model,
      request_text: fullPromptText,
      status: "error",
      error_message: isTimeout ? `Timeout after ${requestTimeout / 1000} seconds` : message,
      attempt_count: attemptCount + 1,
      keywords_found: {},
      regex_matches: {},
      match_percentage: 0,
    })

    await supabase.rpc("increment_failed", { test_run_id: testRunId })
  }
}
