export interface TikTokPublicProfile {
  username: string
  displayName: string
  bio: string | null
  avatarUrl: string | null
  followers: number
  following: number
  likes: number
  videos: number
}

export async function fetchTikTokPublic(
  username: string
): Promise<TikTokPublicProfile | null> {
  try {
    const res = await fetch(
      `https://www.tiktok.com/@${username}?lang=en`,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
      }
    )
    if (!res.ok) return null
    const html = await res.text()

    const sigiData = html.match(/<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__"[^>]*>([\s\S]*?)<\/script>/)
    if (!sigiData) return null

    const data = JSON.parse(sigiData[1])
    const user = data.__DEFAULT_SCOPE__?.["webapp.user-detail"]?.userInfo?.user
    if (!user) return null

    const stats = data.__DEFAULT_SCOPE__?.["webapp.user-detail"]?.userInfo?.stats ?? {}

    return {
      username: user.uniqueId ?? username,
      displayName: user.nickname ?? username,
      bio: user.signature ?? null,
      avatarUrl: user.avatarLarger ?? user.avatarMedium ?? null,
      followers: stats.followerCount ?? 0,
      following: stats.followingCount ?? 0,
      likes: stats.heartCount ?? 0,
      videos: stats.videoCount ?? 0,
    }
  } catch {
    return null
  }
}
