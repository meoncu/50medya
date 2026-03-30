export type Platform = 'youtube' | 'instagram' | 'twitter' | 'tiktok' | 'facebook' | 'pinterest' | 'other'
export type MediaType = 'image' | 'video' | 'unknown'

export interface Post {
  id: string
  url: string
  platform: Platform
  title: string
  description: string
  thumbnail: string
  mediaType: MediaType
  groupId: string | null
  createdAt: Date
  createdBy: string
  published: boolean
  viewerNotes?: string
}

export interface Group {
  id: string
  name: string
  slug: string
  order: number
  icon: string
  visible: boolean
  createdAt: Date
  parentId?: string | null
}

export interface User {
  uid: string
  email: string
  displayName: string
  photoURL: string
  isAdmin: boolean
}

export interface LinkPreviewResult {
  title: string
  description: string
  thumbnail: string
  platform: Platform
  mediaType: MediaType
  url: string
}
