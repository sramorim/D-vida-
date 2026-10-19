import { NextRequest, NextResponse } from "next/server"
import { fetchTikTokPublic } from "@/lib/tiktok/public"

export async function GET(req: NextRequest) {
  const username = req.nextUrl.searchParams.get("username")
  if (!username) {
    return NextResponse.json({ error: "username required" }, { status: 400 })
  }
  const profile = await fetchTikTokPublic(username)
  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 })
  }
  return NextResponse.json(profile)
}
