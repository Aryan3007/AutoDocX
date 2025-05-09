import { supabaseAdmin } from "@/lib/supabase-admin"
import { NextResponse } from "next/server"

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const { data: documentation, error } = await supabaseAdmin
    .from("Documentations")
    .select("*")
    .eq("id", id)
    .single()

  if (error || !documentation) {
    return NextResponse.json({ message: "Documentation not found" }, { status: 404 })
  }

  return NextResponse.json({ documentation }, { status: 200 })
}