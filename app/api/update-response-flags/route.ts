import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const { responseId, flags } = await request.json()

    if (!responseId) {
      return NextResponse.json({ error: "Response ID is required" }, { status: 400 })
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from("ai_responses")
      .update({ flags: flags || [] })
      .eq("id", responseId)
      .select()
      .single()

    if (error) {
      console.error("[v0] Error updating response flags:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("[v0] Error in update-response-flags:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
