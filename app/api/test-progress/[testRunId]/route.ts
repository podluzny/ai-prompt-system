import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request, { params }: { params: Promise<{ testRunId: string }> }) {
  try {
    const { testRunId } = await params
    const supabase = await createClient()

    // Get test run status
    const { data: testRun } = await supabase.from("test_runs").select("*").eq("id", testRunId).single()

    if (!testRun) {
      return NextResponse.json({ error: "Test run not found" }, { status: 404 })
    }

    const { data: latestResponse } = await supabase
      .from("ai_responses")
      .select("ai_model, request_text, created_at")
      .eq("test_run_id", testRunId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    const elapsedTime = new Date().getTime() - new Date(testRun.started_at).getTime()

    return NextResponse.json({
      testRunId: testRun.id,
      status: testRun.status,
      totalRequests: testRun.total_requests,
      completedRequests: testRun.completed_requests,
      failedRequests: testRun.failed_requests,
      currentModel: latestResponse?.ai_model,
      currentPrompt: latestResponse?.request_text,
      elapsedTime,
    })
  } catch (error) {
    console.error("Error fetching test progress:", error)
    return NextResponse.json({ error: "Failed to fetch progress" }, { status: 500 })
  }
}
