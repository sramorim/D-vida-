export interface TimelineEvent {
  date: string
  platform: string
  event: string
  details: string
}

const TIMEOUT_MS = 15000

async function fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    return await fetch(url, { ...options, signal: controller.signal })
  } finally {
    clearTimeout(timeout)
  }
}

async function fetchGitHubActivity(username: string): Promise<TimelineEvent[]> {
  try {
    const events: TimelineEvent[] = []

    const userUrl = `https://api.github.com/users/${username}`
    const userResponse = await fetchWithTimeout(userUrl, {
      headers: { 'Accept': 'application/vnd.github.v3+json' }
    })

    if (userResponse.ok) {
      const user = await userResponse.json()
      if (user.created_at) {
        events.push({
          date: user.created_at.split('T')[0],
          platform: 'GitHub',
          event: 'Account Created',
          details: `GitHub account created: ${user.bio || 'No bio'}`
        })
      }
    }

    const reposUrl = `https://api.github.com/users/${username}/repos?per_page=100&sort=created`
    const reposResponse = await fetchWithTimeout(reposUrl, {
      headers: { 'Accept': 'application/vnd.github.v3+json' }
    })

    if (reposResponse.ok) {
      const repos = await reposResponse.json()
      if (Array.isArray(repos)) {
        repos.slice(0, 10).forEach((repo: Record<string, unknown>) => {
          if (repo.created_at) {
            events.push({
              date: String(repo.created_at).split('T')[0],
              platform: 'GitHub',
              event: 'Repository Created',
              details: `Created repository: ${repo.name || 'Unknown'}`
            })
          }
          if (repo.pushed_at && repo.pushed_at !== repo.created_at) {
            events.push({
              date: String(repo.pushed_at).split('T')[0],
              platform: 'GitHub',
              event: 'Activity',
              details: `Last pushed to: ${repo.name || 'Unknown'}`
            })
          }
        })
      }
    }

    return events
  } catch {
    return []
  }
}

async function fetchRedditActivity(username: string): Promise<TimelineEvent[]> {
  try {
    const events: TimelineEvent[] = []
    const url = `https://www.reddit.com/user/${username}/about.json`
    const response = await fetchWithTimeout(url, {
      headers: { 'User-Agent': 'ShandonElite-OSINT/1.0' }
    })

    if (response.ok) {
      const data = await response.json()
      if (data.data && data.data.created_utc) {
        const createdDate = new Date(data.data.created_utc * 1000)
        events.push({
          date: createdDate.toISOString().split('T')[0],
          platform: 'Reddit',
          event: 'Account Created',
          details: `Reddit account created: ${data.data.subreddit?.public_description || ''}`
        })

        if (data.data.total_karma) {
          events.push({
            date: new Date().toISOString().split('T')[0],
            platform: 'Reddit',
            event: 'Karma Milestone',
            details: `Total karma: ${data.data.total_karma}`
          })
        }
      }
    }

    return events
  } catch {
    return []
  }
}

async function fetchTwitterActivity(username: string): Promise<TimelineEvent[]> {
  try {
    const events: TimelineEvent[] = []

    const nitterUrl = `https://nitter.net/${username}`
    const response = await fetchWithTimeout(nitterUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    })

    if (response.ok) {
      const html = await response.text()

      const joinDateMatch = html.match(/Joined\s+([A-Z][a-z]+\s+\d{4})/)
      if (joinDateMatch) {
        const joinDate = new Date(joinDateMatch[1])
        if (!isNaN(joinDate.getTime())) {
          events.push({
            date: joinDate.toISOString().split('T')[0],
            platform: 'Twitter/X',
            event: 'Account Created',
            details: 'Twitter account created'
          })
        }
      }
    }

    return events
  } catch {
    return []
  }
}

async function fetchInstagramActivity(username: string): Promise<TimelineEvent[]> {
  try {
    const events: TimelineEvent[] = []

    const response = await fetchWithTimeout(`https://www.instagram.com/${username}/`, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    })

    if (response.ok) {
      const html = await response.text()

      const joinedMatch = html.match(/"date_joined":"(\d{4}-\d{2}-\d{2})"/)
      if (joinedMatch) {
        events.push({
          date: joinedMatch[1],
          platform: 'Instagram',
          event: 'Account Created',
          details: 'Instagram account created'
        })
      }
    }

    return events
  } catch {
    return []
  }
}

export async function buildTimeline(username: string): Promise<TimelineEvent[]> {
  if (!username || username.trim().length === 0) {
    throw new Error('Username is required')
  }

  const trimmedUsername = username.trim()

  const [githubEvents, redditEvents, twitterEvents, instagramEvents] = await Promise.all([
    fetchGitHubActivity(trimmedUsername),
    fetchRedditActivity(trimmedUsername),
    fetchTwitterActivity(trimmedUsername),
    fetchInstagramActivity(trimmedUsername)
  ])

  const allEvents = [...githubEvents, ...redditEvents, ...twitterEvents, ...instagramEvents]

  allEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  const uniqueEvents = allEvents.filter((event, index, self) =>
    index === self.findIndex(e =>
      e.date === event.date &&
      e.platform === event.platform &&
      e.event === event.event
    )
  )

  return uniqueEvents.slice(0, 100)
}
