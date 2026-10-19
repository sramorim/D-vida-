import { NextRequest, NextResponse } from "next/server"
import { requirePremium } from "@/lib/auth"
import { fetchFacebookPro } from "@/lib/facebook/authenticated"

export async function POST(req: NextRequest) {
  const { error } = await requirePremium(req)
  if (error) return error

  const body = await req.json()
  const { username, sessionCookie } = body
  if (!username || !sessionCookie) {
    return NextResponse.json(
      { error: "username and sessionCookie required" },
      { status: 400 }
    )
  }

  const profile = await fetchFacebookPro(username, sessionCookie)
  if (!profile) {
    return NextResponse.json(
      { error: "Failed to fetch pro profile" },
      { status: 404 }
    )
  }
  return NextResponse.json(profile)
}
