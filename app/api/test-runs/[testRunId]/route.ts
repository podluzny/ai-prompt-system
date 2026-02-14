import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ testRunId: string }> }) {
  try {
    const { testRunId } = await params
    const supabase = await createClient()

    // Delete test run (cascade will delete related ai_responses and request_logs)
    const { error } = await supabase.from("test_runs").delete().eq("id", testRunId)

    if (error) {
      console.error("Error deleting test run:", error)
      return NextResponse.json({ error: "Failed to delete test run" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in DELETE /api/test-runs/[testRunId]:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
