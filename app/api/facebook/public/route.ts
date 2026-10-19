import { NextRequest, NextResponse } from "next/server"
import { fetchFacebookPublic } from "@/lib/facebook/public"

export async function GET(req: NextRequest) {
  const username = req.nextUrl.searchParams.get("username")
  if (!username) {
    return NextResponse.json({ error: "username required" }, { status: 400 })
  }
  const profile = await fetchFacebookPublic(username)
  if (!profile) {
    // "Profile not found" era enganoso: o perfil pode existir, mas o Facebook
    // não permite mais leitura pública por URL. Sem isto, o usuário achava que
    // o perfil não existia e tentava outros usernames à toa.
    if (!process.env.FB_ACCESS_TOKEN) {
      return NextResponse.json(
        {
          error: "Facebook exige credencial da Meta",
          details:
            "Desde 2019 o Facebook não permite mais ler perfil por URL. " +
            "É preciso um token gratuito do developers.facebook.com com a " +
            "permissão public_profile. Configure FB_ACCESS_TOKEN no ambiente.",
        },
        { status: 501 }
      )
    }
    return NextResponse.json(
      {
        error: "Perfil não encontrado ou inacessível",
        details:
          "Token configurado, mas o Facebook não devolveu dados. " +
          "Confirme se o perfil é público e se o token tem public_profile.",
      },
      { status: 404 }
    )
  }
  return NextResponse.json(profile)
}
