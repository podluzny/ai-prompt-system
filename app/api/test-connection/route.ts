import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { provider, model, apiKey, folderId, baseURL } = await request.json()

    console.log("[v0] Testing connection for:", { provider, model })

    //if (provider === "ai-gateway") {
      // AI Gateway models in v0 preview don't have direct access testing
      //return NextResponse.json({
      //  status: "OK",
      //  message: "AI Gateway модели работают через Vercel AI SDK",
      //})
    //}
if (provider === "ai-gateway") {
  const apiKey = process.env.AI_GATEWAY_API_KEY
  try {
    if (!apiKey) {
      return NextResponse.json({
        status: "ERROR",
        message: "Vercel API Token не указан",
      })
    }

    const gatewayUrl =
      //"https://api.vercel.com/v1/chat/completions"
      baseURL || "https://ai-gateway.vercel.sh/v1/chat/completions" 
      //baseURL || "https://ai-gateway.vercel.sh/v1/app/api/test-connection/route"
      
      //baseURL || "https://ai-gateway.vercel.sh/v3/ai/language-model"
      
      //baseURL || "https://ai-gateway.vercel.sh/v3/ai"
      // https://ai-gateway.vercel.sh/v3/ai
      //baseURL || "https://gateway.vercel.ai/v1/chat/completions"

    const response = await fetch(gatewayUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model, // например: "openai/gpt-4o-mini"
        messages: [
          { role: "user", content: "Test connection. Reply with 'OK'." },
        ],
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
      message: "Подключение к Vercel AI Gateway успешно установлено",
      response: data.choices?.[0]?.message?.content || "OK",
    })
  } catch (error: any) {
    return NextResponse.json({
      status: "ERROR",
      message: error.message || "Ошибка подключения к Vercel AI Gateway",
    })
  }
}


    // If no API key and not Yandex, can't test
    if (!apiKey && provider !== "yandex-ai") {
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
            Authorization: `Bearer ${apiKey}`,
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
            "x-api-key": apiKey,
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
            Authorization: `Bearer ${apiKey}`,
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

        // Yandex AI uses /responses endpoint (not /responses/create)
        const response = await fetch(`${url}/responses`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
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
            Authorization: `Bearer ${apiKey}`,
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
