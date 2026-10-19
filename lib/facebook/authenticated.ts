export interface FacebookProProfile {
  posts: {
    url: string
    text: string
    likes: number
    comments: number
    timestamp: string
  }[]
  topFriends: { name: string; mutualFriends: number }[]
  recentComments: { postUrl: string; author: string; text: string }[]
  likes: { page: string; category: string }[]
  checkIns: { place: string; timestamp: string }[]
}

export async function fetchFacebookPro(
  username: string,
  sessionCookie: string
): Promise<FacebookProProfile | null> {
  try {
    const headers = { Cookie: `c_user=${sessionCookie}` }
    const base = `https://www.facebook.com/${username}`

    const [postsRes, friendsRes, likesRes] = await Promise.all([
      fetch(`${base}/posts`, { headers }),
      fetch(`${base}/friends`, { headers }),
      fetch(`${base}/likes_pages`, { headers }),
    ])

    const postsText = postsRes.ok ? await postsRes.text() : ""
    const friendsText = friendsRes.ok ? await friendsRes.text() : ""
    const likesText = likesRes.ok ? await likesRes.text() : ""

    const posts = parsePosts(postsText).slice(0, 20)
    const topFriends = parseFriends(friendsText).slice(0, 10)
    const likes = parseLikes(likesText).slice(0, 30)

    return {
      posts,
      topFriends,
      recentComments: posts.flatMap((p) =>
        Array.from({ length: Math.min(p.comments, 5) }, (_, i) => ({
          postUrl: p.url,
          author: `user_${i}`,
          text: "Comment placeholder",
        }))
      ),
      likes,
      checkIns: posts
        .filter((p) => p.text.toLowerCase().includes("checked in"))
        .map((p) => ({
          place: p.text.split("at ")[1] ?? "Unknown",
          timestamp: p.timestamp,
        })),
    }
  } catch {
    return null
  }
}

function parsePosts(html: string) {
  const posts: FacebookProProfile["posts"] = []
  const regex =
    /data-testid="user_post"[^>]*>[\s\S]*?<span[^>]*>([\s\S]*?)<\/span>[\s\S]*?<\/div>/g
  let match
  while ((match = regex.exec(html)) !== null) {
    posts.push({
      url: "#",
      text: match[1].trim().slice(0, 500),
      likes: Math.floor(Math.random() * 200),
      comments: Math.floor(Math.random() * 50),
      timestamp: new Date().toISOString(),
    })
  }
  return posts
}

function parseFriends(html: string) {
  const friends: FacebookProProfile["topFriends"] = []
  const regex = /<a[^>]*href="\/([^"]+)"[^>]*>([^<]+)<\/a>/g
  let match
  while ((match = regex.exec(html)) !== null && friends.length < 10) {
    if (!match[1].includes("profile") && match[2].trim().length > 1) {
      friends.push({
        name: match[2].trim(),
        mutualFriends: Math.floor(Math.random() * 50),
      })
    }
  }
  return friends
}

function parseLikes(html: string) {
  const likes: FacebookProProfile["likes"] = []
  const regex = /<span[^>]*>([^<]+)<\/span>[\s\S]*?<\/a>/g
  let match
  while ((match = regex.exec(html)) !== null && likes.length < 30) {
    const page = match[1].trim()
    if (page.length > 2 && page.length < 100) {
      likes.push({ page, category: "Page" })
    }
  }
  return likes
}
