import type { LinkPreviewResult, Platform, MediaType } from '../types'

function detectPlatform(url: string): Platform {
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube'
  if (url.includes('instagram.com')) return 'instagram'
  if (url.includes('twitter.com') || url.includes('x.com')) return 'twitter'
  if (url.includes('tiktok.com')) return 'tiktok'
  if (url.includes('facebook.com') || url.includes('fb.com')) return 'facebook'
  if (url.includes('pinterest.com') || url.includes('pin.it')) return 'pinterest'
  return 'other'
}

function detectMediaType(platform: Platform, url: string): MediaType {
  if (platform === 'youtube') return 'video'
  if (platform === 'tiktok') return 'video'
  if (platform === 'pinterest') return 'image'
  if (url.match(/\.(jpg|jpeg|png|gif|webp)(\?|$)/i)) return 'image'
  if (url.match(/\.(mp4|mov|avi|webm)(\?|$)/i)) return 'video'
  if (platform === 'instagram') return 'video'
  if (platform === 'twitter') return 'video'
  return 'unknown'
}

async function fetchWithTimeout(resource: string, options: RequestInit & { timeout?: number } = {}) {
  const { timeout = 8000 } = options
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), timeout)
  try {
    const response = await fetch(resource, { ...options, signal: controller.signal })
    clearTimeout(id)
    return response
  } catch (error) {
    clearTimeout(id)
    throw error
  }
}

export async function fetchLinkPreview(url: string): Promise<LinkPreviewResult> {
  const platform = detectPlatform(url)
  const mediaType = detectMediaType(platform, url)
  const normalizedUrl = url.trim()

  // --- STRATEGY 1: Local API (Server-side Proxy) ---
  // This is now the most reliable way as it handles Twitter APIs and scraping server-side
  try {
    const res = await fetchWithTimeout(`/api/link-preview?url=${encodeURIComponent(normalizedUrl)}`, { timeout: 6000 })
    if (res.ok) {
      const data = await res.json()
      if (data.title || data.thumbnail) {
        return {
          title: data.title || '',
          description: data.description || '',
          thumbnail: data.thumbnail || '',
          platform,
          mediaType,
          url: normalizedUrl,
        }
      }
    }
  } catch (err) {
    console.warn('Local API error:', err)
  }

  // --- STRATEGY 2: Twitter Specific Fallbacks (Browser-side) ---
  if (platform === 'twitter') {
    // Only try if local API failed and we are in a browser context that might allow it
    // Note: Most likely to fail due to CORS, but worth a shot as a second fallback
    const apiUri = normalizedUrl
      .replace(/(?:x|twitter)\.com/, 'api.fxtwitter.com')
      .split('?')[0]

    try {
      const res = await fetchWithTimeout(apiUri, { timeout: 4000 })
      if (res.ok) {
        const data = await res.json()
        const tweet = data.tweet || data
        if (tweet && (tweet.text || tweet.description)) {
          return {
            title: (tweet.text || tweet.description || '').slice(0, 100).replace(/\n/g, ' '),
            description: tweet.text || tweet.description || '',
            thumbnail: tweet.media?.all?.[0]?.url || tweet.author?.avatar_url || '',
            platform,
            mediaType: (tweet.media?.all?.[0]?.type === 'video' || tweet.has_video) ? 'video' : 'image',
            url: normalizedUrl,
          }
        }
      }
    } catch (err) {
      // ignore
    }
  }

  // --- STRATEGY 3: General Fallback (AllOrigins) ---
  try {
    const crossRes = await fetchWithTimeout(`https://api.allorigins.win/get?url=${encodeURIComponent(normalizedUrl)}`, { timeout: 7000 })
    if (crossRes.ok) {
      const crossData = await crossRes.json()
      const html = crossData.contents

      const getMeta = (prop: string) => {
        const regexes = [
          new RegExp(`<meta[^>]+(?:property|name)=["'](?:og:|twitter:)?${prop}["'][^>]+content=["']([^"']+)["']`, 'i'),
          new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["'](?:og:|twitter:)?${prop}["']`, 'i')
        ]
        for (const regex of regexes) {
          const match = html.match(regex)
          if (match?.[1]) return match[1]
        }
        return ''
      }

      const title = getMeta('title') || html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] || ''
      const thumbnail = getMeta('image') || getMeta('image:src') || getMeta('thumbnail')
      const description = getMeta('description')

      if (title || thumbnail) {
        return {
          title: (title || normalizedUrl).trim(),
          description: (description || '').trim(),
          thumbnail: (thumbnail || '').trim(),
          platform,
          mediaType,
          url: normalizedUrl,
        }
      }
    }
  } catch (err) {
    console.warn('AllOrigins fallback error:', err)
  }

  // --- STRATEGY 4: Platform specific constants (YouTube) ---
  if (platform === 'youtube') {
    const match = normalizedUrl.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
    if (match) {
      return {
        title: 'YouTube Video',
        description: '',
        thumbnail: `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg`,
        platform,
        mediaType,
        url: normalizedUrl,
      }
    }
  }

  return {
    title: platform === 'twitter' ? 'X (Twitter) Paylaşımı' : normalizedUrl,
    description: '',
    thumbnail: '',
    platform,
    mediaType,
    url: normalizedUrl
  }
}
