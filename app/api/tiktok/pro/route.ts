import { NextRequest, NextResponse } from "next/server"
import { requirePremium } from "@/lib/auth"
import { fetchTikTokPro } from "@/lib/tiktok/authenticated"

export async function POST(req: NextRequest) {
  const { error } = await requirePremium(req)
  if (error) return error

  const body = await req.json()
  const { username } = body
  if (!username) {
    return NextResponse.json({ error: "username required" }, { status: 400 })
  }

  const profile = await fetchTikTokPro(username)
  if (!profile) {
    return NextResponse.json(
      { error: "Failed to fetch pro profile" },
      { status: 404 }
    )
  }
  return NextResponse.json(profile)
}
