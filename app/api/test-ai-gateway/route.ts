import { NextResponse } from "next/server"

export async function GET() {
  const gatewayUrl = process.env.AI_GATEWAY_URL
  const apiKey = process.env.AI_GATEWAY_API_KEY

  const diagnostics: Record<string, any> = {
    AI_GATEWAY_URL: gatewayUrl ? `${gatewayUrl.slice(0, 30)}...` : "NOT SET",
    AI_GATEWAY_API_KEY: apiKey ? `${apiKey.slice(0, 8)}...${apiKey.slice(-4)}` : "NOT SET",
  }

  // Test 1: Direct fetch to AI Gateway to get raw error
  try {
    const response = await fetch(`${gatewayUrl || "https://ai-gateway.vercel.sh"}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        messages: [{ role: "user", content: "Say OK" }],
        max_tokens: 10,
      }),
    })

    const body = await response.text()
    diagnostics.directFetch = {
      status: response.status,
      statusText: response.statusText,
      body: body.slice(0, 500),
      headers: Object.fromEntries(response.headers.entries()),
    }

    if (response.ok) {
      const data = JSON.parse(body)
      return NextResponse.json({
        success: true,
        message: "AI Gateway работает!",
        response: data.choices?.[0]?.message?.content,
        diagnostics,
      })
    }
  } catch (error: any) {
    diagnostics.directFetchError = error.message
  }

  // Test 2: Try AI SDK generateText
  try {
    const { generateText } = await import("ai")
    const result = await generateText({
      model: "openai/gpt-4o-mini",
      prompt: "Say OK",
      maxOutputTokens: 10,
    })
    return NextResponse.json({
      success: true,
      message: "AI SDK Gateway работает!",
      response: result.text,
      diagnostics,
    })
  } catch (error: any) {
    diagnostics.aiSdkError = error.message
  }

  return NextResponse.json(
    {
      success: false,
      message: "AI Gateway не работает. Проверьте настройки:",
      instructions: [
        "1. Откройте Vercel Dashboard -> ваш проект -> Settings -> AI Gateway",
        "2. Убедитесь что AI Gateway включен и провайдеры (OpenAI, Anthropic) настроены с API ключами",
        "3. Создайте AI Gateway API Key если не создан",
        "4. Проверьте что AI_GATEWAY_API_KEY и AI_GATEWAY_URL установлены в Environment Variables проекта",
        "5. После изменений сделайте Redeploy проекта",
      ],
      diagnostics,
    },
    { status: 500 },
  )
}
