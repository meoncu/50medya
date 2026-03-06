import type { LinkPreviewResult, Platform, MediaType } from '../types'

function detectPlatform(url: string): Platform {
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube'
  if (url.includes('instagram.com')) return 'instagram'
  if (url.includes('twitter.com') || url.includes('x.com')) return 'twitter'
  if (url.includes('tiktok.com')) return 'tiktok'
  if (url.includes('facebook.com') || url.includes('fb.com')) return 'facebook'
  return 'other'
}

function detectMediaType(platform: Platform, url: string): MediaType {
  if (platform === 'youtube') return 'video'
  if (platform === 'tiktok') return 'video'
  if (url.match(/\.(jpg|jpeg|png|gif|webp)(\?|$)/i)) return 'image'
  if (url.match(/\.(mp4|mov|avi|webm)(\?|$)/i)) return 'video'
  if (platform === 'instagram') return 'video'
  if (platform === 'twitter') return 'video'
  return 'unknown'
}

export async function fetchLinkPreview(url: string): Promise<LinkPreviewResult> {
  const platform = detectPlatform(url)
  const mediaType = detectMediaType(platform, url)

  try {
    const res = await fetch(`/api/link-preview?url=${encodeURIComponent(url)}`)
    if (res.ok) {
      const data = await res.json()
      return {
        title: data.title || '',
        description: data.description || '',
        thumbnail: data.thumbnail || '',
        platform,
        mediaType,
        url,
      }
    }
  } catch {
    // fallback below
  }

  // YouTube thumbnail fallback
  if (platform === 'youtube') {
    const match = url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
    if (match) {
      return {
        title: 'YouTube Video',
        description: '',
        thumbnail: `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg`,
        platform,
        mediaType,
        url,
      }
    }
  }

  return { title: url, description: '', thumbnail: '', platform, mediaType, url }
}
