import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { provider, model, apiKey: userApiKey, folderId, baseURL } = await request.json()

    console.log("[v0] Testing connection for:", { provider, model })

    // AI Gateway - используем Vercel AI SDK для реального тестирования
    if (provider === "ai-gateway") {
      try {
        // Динамически импортируем SDK
        const { generateText } = await import('ai')
        
        // Парсим model string (например: "openai/gpt-4o-mini" или "anthropic/claude-3-5-sonnet")
        const modelParts = model.split("/")
        const providerName = modelParts.length > 1 ? modelParts[0] : "openai"
        const modelName = modelParts.length > 1 ? modelParts.slice(1).join("/") : model

        console.log("[v0] AI Gateway test:", { providerName, modelName })

        // Получаем нужный SDK provider
        let sdkModel
        
        if (providerName === "openai") {
          const { openai } = await import('@ai-sdk/openai')
          sdkModel = openai(modelName)
        } else if (providerName === "anthropic") {
          const { anthropic } = await import('@ai-sdk/anthropic')
          sdkModel = anthropic(modelName)
        } else if (providerName === "google") {
          const { google } = await import('@ai-sdk/google')
          sdkModel = google(modelName)
        } else if (providerName === "mistral") {
          const { mistral } = await import('@ai-sdk/mistral')
          sdkModel = mistral(modelName)
        } else {
          // Fallback на openai для неизвестных провайдеров
          const { openai } = await import('@ai-sdk/openai')
          sdkModel = openai(model)
        }

        // Реальный тест через SDK
        const result = await generateText({
          model: sdkModel,
          prompt: "Test connection. Reply with 'OK'.",
          maxTokens: 10,
        })

        return NextResponse.json({
          status: "OK",
          message: `AI Gateway (${providerName}) успешно протестирован через Vercel AI SDK`,
          response: result.text,
        })
      } catch (error: any) {
        console.error("[v0] AI Gateway SDK error:", error)
        return NextResponse.json({
          status: "ERROR",
          message: error.message || "Ошибка подключения к AI Gateway через SDK",
          details: error.toString(),
        })
      }
    }

    // If no API key and not Yandex, can't test
    if (!userApiKey && provider !== "yandex-ai") {
      return NextResponse.json({
        status: "ERROR",
        message: "API ключ не указан. Добавьте API ключ для проверки подключения.",
      })
    }

    // Test OpenAI
    if (provider === "openai") {
      try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${userApiKey}`,
          },
          body: JSON.stringify({
            model: model,
            messages: [{ role: "user", content: "Test connection. Reply with 'OK'." }],
            max_tokens: 10,
          }),
        })

        if (!response.ok) {
          const error = await response.json()
          return NextResponse.json({
            status: "ERROR",
            message: error.error?.message || `HTTP ${response.status}`,
          })
        }

        const data = await response.json()
        return NextResponse.json({
          status: "OK",
          message: "Подключение к OpenAI успешно установлено",
          response: data.choices[0]?.message?.content || "OK",
        })
      } catch (error: any) {
        return NextResponse.json({
          status: "ERROR",
          message: error.message || "Ошибка подключения к OpenAI",
        })
      }
    }

    // Test Anthropic
    if (provider === "anthropic") {
      try {
        const response = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": userApiKey,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model: model,
            messages: [{ role: "user", content: "Test connection. Reply with 'OK'." }],
            max_tokens: 10,
          }),
        })

        if (!response.ok) {
          const error = await response.json()
          return NextResponse.json({
            status: "ERROR",
            message: error.error?.message || `HTTP ${response.status}`,
          })
        }

        const data = await response.json()
        return NextResponse.json({
          status: "OK",
          message: "Подключение к Anthropic успешно установлено",
          response: data.content[0]?.text || "OK",
        })
      } catch (error: any) {
        return NextResponse.json({
          status: "ERROR",
          message: error.message || "Ошибка подключения к Anthropic",
        })
      }
    }

    // Test DeepSeek
    if (provider === "deepseek") {
      try {
        const url = baseURL || "https://api.deepseek.com"
        console.log("[v0] DeepSeek test - model:", model, "url:", url)

        const response = await fetch(`${url}/v1/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${userApiKey}`,
          },
          body: JSON.stringify({
            model: model,
            messages: [{ role: "user", content: "Test connection. Reply with 'OK'." }],
            max_tokens: 10,
          }),
        })

        if (!response.ok) {
          const errorText = await response.text()
          console.error("[v0] DeepSeek error response:", errorText)
          return NextResponse.json({
            status: "ERROR",
            message: `HTTP ${response.status}: ${errorText}`,
          })
        }

        const data = await response.json()
        return NextResponse.json({
          status: "OK",
          message: "Подключение к DeepSeek успешно установлено",
          response: data.choices?.[0]?.message?.content || "OK",
        })
      } catch (error: any) {
        console.error("[v0] DeepSeek connection error:", error)
        return NextResponse.json({
          status: "ERROR",
          message: error.message || "Ошибка подключения к DeepSeek",
        })
      }
    }

    // Test Yandex AI
    if (provider === "yandex-ai") {
      try {
        const url = baseURL || "https://rest-assistant.api.cloud.yandex.net/v1"

        const response = await fetch(`${url}/responses`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${userApiKey}`,
            "OpenAI-Project": folderId || "",
          },
          body: JSON.stringify({
            model: `gpt://${folderId}/${model}`,
            instructions: "",
            input: "Test connection. Reply with 'OK'.",
            temperature: 0.3,
            max_output_tokens: 50,
          }),
        })

        if (!response.ok) {
          const errorText = await response.text()
          return NextResponse.json({
            status: "ERROR",
            message: `HTTP ${response.status}: ${errorText}`,
          })
        }

        const data = await response.json()
        return NextResponse.json({
          status: "OK",
          message: "Подключение к Yandex AI успешно установлено",
          response: data.output_text || "OK",
        })
      } catch (error: any) {
        return NextResponse.json({
          status: "ERROR",
          message: error.message || "Ошибка подключения к Yandex AI",
        })
      }
    }

    // Test Custom provider
    if (provider === "custom" && baseURL) {
      try {
        const response = await fetch(`${baseURL}/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${userApiKey}`,
          },
          body: JSON.stringify({
            model: model,
            messages: [{ role: "user", content: "Test connection. Reply with 'OK'." }],
            max_tokens: 10,
          }),
        })

        if (!response.ok) {
          const errorText = await response.text()
          return NextResponse.json({
            status: "ERROR",
            message: `HTTP ${response.status}: ${errorText}`,
          })
        }

        const data = await response.json()
        return NextResponse.json({
          status: "OK",
          message: "Подключение к Custom провайдеру успешно установлено",
          response: data.choices?.[0]?.message?.content || "OK",
        })
      } catch (error: any) {
        return NextResponse.json({
          status: "ERROR",
          message: error.message || "Ошибка подключения к провайдеру",
        })
      }
    }

    return NextResponse.json({
      status: "ERROR",
      message: "Неизвестный провайдер",
    })
  } catch (error: any) {
    console.error("[v0] Connection test error:", error)
    return NextResponse.json({
      status: "ERROR",
      message: error.message || "Ошибка при проверке подключения",
    })
  }
}
