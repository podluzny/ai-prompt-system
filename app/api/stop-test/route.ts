import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { testRunId } = await request.json()

    if (!testRunId) {
      return NextResponse.json({ error: "Test run ID is required" }, { status: 400 })
    }

    const supabase = await createClient()

    // Update test run status to stopped
    const { error } = await supabase
      .from("test_runs")
      .update({
        status: "stopped",
        completed_at: new Date().toISOString(),
      })
      .eq("id", testRunId)

    if (error) throw error

    return NextResponse.json({
      success: true,
      message: "Test stopped successfully",
    })
  } catch (error) {
    console.error("Error stopping test:", error)
    return NextResponse.json({ error: "Failed to stop test" }, { status: 500 })
  }
}
