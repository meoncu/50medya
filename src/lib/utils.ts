import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  if (seconds < 60) return 'az önce'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} dk önce`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} sa önce`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days} gün önce`
  return date.toLocaleDateString('tr-TR')
}

export function platformLabel(platform: string): string {
  const map: Record<string, string> = {
    youtube: 'YouTube',
    instagram: 'Instagram',
    twitter: 'Twitter/X',
    tiktok: 'TikTok',
    facebook: 'Facebook',
    other: 'Diğer',
  }
  return map[platform] ?? platform
}

export function platformColor(platform: string): string {
  const map: Record<string, string> = {
    youtube: 'bg-red-100 text-red-700',
    instagram: 'bg-pink-100 text-pink-700',
    twitter: 'bg-sky-100 text-sky-700',
    tiktok: 'bg-slate-100 text-slate-700',
    facebook: 'bg-blue-100 text-blue-700',
    other: 'bg-gray-100 text-gray-700',
  }
  return map[platform] ?? 'bg-gray-100 text-gray-700'
}
