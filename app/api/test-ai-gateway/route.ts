import { NextResponse } from "next/server"
import OpenAI from "openai"

export async function GET() {
  const apiKey = process.env.AI_GATEWAY_API_KEY || process.env.OPENAI_API_KEY

  const diagnostics: Record<string, any> = {
    AI_GATEWAY_API_KEY: apiKey ? `${apiKey.slice(0, 8)}...${apiKey.slice(-4)}` : "NOT SET",
  }

  if (!apiKey) {
    return NextResponse.json(
      {
        success: false,
        message: "API ключ не установлен",
        instructions: [
          "Установите OPENAI_API_KEY или AI_GATEWAY_API_KEY в переменных окружения",
          "Для OpenAI получите ключ на https://platform.openai.com/api-keys",
        ],
        diagnostics,
      },
      { status: 400 }
    )
  }

  // Test OpenAI SDK with direct OpenAI API
  try {
    console.log("[v0] Testing OpenAI SDK connection...")
    
    const client = new OpenAI({
      apiKey: apiKey,
      baseURL: "https://api.openai.com/v1",
    })

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: "Say OK" }],
      max_tokens: 10,
    })

    const response = completion.choices[0]?.message?.content || "No response"
    
    console.log("[v0] OpenAI SDK test successful:", response)

    return NextResponse.json({
      success: true,
      message: "OpenAI SDK работает корректно!",
      response: response,
      model: completion.model,
      diagnostics: {
        ...diagnostics,
        finishReason: completion.choices[0]?.finish_reason,
        usage: completion.usage,
      },
    })
  } catch (error: any) {
    console.error("[v0] OpenAI SDK error:", error)
    
    diagnostics.error = {
      message: error.message,
      type: error.type,
      code: error.code,
      status: error.status,
    }

    return NextResponse.json(
      {
        success: false,
        message: "Ошибка подключения через OpenAI SDK",
        error: error.message,
        instructions: [
          "Проверьте что API ключ корректен",
          "Убедитесь что у вас есть доступ к OpenAI API",
          "Проверьте баланс аккаунта на https://platform.openai.com/account/usage",
        ],
        diagnostics,
      },
      { status: 500 }
    )
  }
}
