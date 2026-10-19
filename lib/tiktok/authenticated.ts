export interface TikTokProProfile {
  videos: {
    url: string
    thumbnail: string
    caption: string
    views: number
    likes: number
    comments: number
    timestamp: string
  }[]
  topCommenters: { username: string; count: number }[]
  hashtagUsage: { tag: string; count: number }[]
  engagementRate: number
}

export async function fetchTikTokPro(
  username: string
): Promise<TikTokProProfile | null> {
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

    const sigiData = html.match(
      /<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__"[^>]*>([\s\S]*?)<\/script>/
    )
    if (!sigiData) return null

    const data = JSON.parse(sigiData[1])
    const itemList =
      data.__DEFAULT_SCOPE__?.["webapp.user-detail"]?.itemList ?? []
    const stats =
      data.__DEFAULT_SCOPE__?.["webapp.user-detail"]?.userInfo?.stats ?? {}

    const videos = itemList.map((item: Record<string, unknown>) => {
      const author = (item.author as Record<string, unknown>) ?? {}
      const statsItem = (item.stats as Record<string, unknown>) ?? {}
      return {
        url: `https://www.tiktok.com/@${username}/video/${item.id}`,
        thumbnail: (item.video as Record<string, unknown>)?.cover as string ?? "",
        caption: (item.desc as string) ?? "",
        views: (statsItem.playCount as number) ?? 0,
        likes: (statsItem.diggCount as number) ?? 0,
        comments: (statsItem.commentCount as number) ?? 0,
        timestamp: item.createTime
          ? new Date((item.createTime as number) * 1000).toISOString()
          : new Date().toISOString(),
      }
    })

    const totalViews = videos.reduce((sum: number, v: TikTokProProfile["videos"][0]) => sum + v.views, 0)
    const totalLikes = videos.reduce((sum: number, v: TikTokProProfile["videos"][0]) => sum + v.likes, 0)
    const followerCount = (stats.followerCount as number) ?? 1
    const engagementRate =
      followerCount > 0
        ? Number(((totalLikes / followerCount / videos.length) * 100).toFixed(2))
        : 0

    const hashtagMap = new Map<string, number>()
    videos.forEach((v: TikTokProProfile["videos"][0]) => {
      const tags = v.caption.match(/#\w+/g) ?? []
      tags.forEach((tag) => hashtagMap.set(tag, (hashtagMap.get(tag) ?? 0) + 1))
    })

    const hashtagUsage = Array.from(hashtagMap.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20)

    return {
      videos: videos.slice(0, 30),
      topCommenters: [],
      hashtagUsage,
      engagementRate,
    }
  } catch {
    return null
  }
}
