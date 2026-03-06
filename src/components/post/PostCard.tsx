import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Download, Share2, Play, Image as ImageIcon } from 'lucide-react'
import type { Post } from '../../types'
import { platformLabel, platformColor, timeAgo, cn } from '../../lib/utils'
import { useStore } from '../../store'

interface PostCardProps {
  post: Post
  groupName?: string
}

export function PostCard({ post, groupName }: PostCardProps) {
  const groups = useStore((s) => s.groups)
  const group = groups.find((g) => g.id === post.groupId)
  const [imgError, setImgError] = useState(false)

  async function handleShare() {
    if (navigator.share) {
      await navigator.share({ title: post.title, url: post.url })
    } else {
      await navigator.clipboard.writeText(post.url)
    }
  }

  return (
    <article className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
      <Link to={`/post/${post.id}`} className="block relative">
        <div className="relative w-full aspect-video bg-slate-100">
          {post.thumbnail && !imgError ? (
            <img
              src={post.thumbnail}
              alt={post.title}
              className="w-full h-full object-cover"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageIcon size={40} className="text-slate-300" />
            </div>
          )}
          {post.mediaType === 'video' && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 bg-black/50 rounded-full flex items-center justify-center backdrop-blur-sm">
                <Play size={22} className="text-white ml-1" fill="white" />
              </div>
            </div>
          )}
        </div>
      </Link>

      <div className="p-3">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', platformColor(post.platform))}>
            {platformLabel(post.platform)}
          </span>
          {(group || groupName) && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
              {group?.icon} {group?.name ?? groupName}
            </span>
          )}
        </div>

        <Link to={`/post/${post.id}`}>
          <h3 className="text-sm font-semibold text-slate-800 line-clamp-2 hover:text-primary-600 transition-colors">
            {post.title || post.url}
          </h3>
        </Link>

        <div className="mt-2 flex items-center justify-between">
          <span className="text-xs text-slate-400">{timeAgo(post.createdAt)}</span>
          <div className="flex items-center gap-1">
            <a
              href={`/api/download?url=${encodeURIComponent(post.url)}&type=${post.mediaType}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 text-slate-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
              title="İndir"
              onClick={(e) => e.stopPropagation()}
            >
              <Download size={16} />
            </a>
            <button
              onClick={handleShare}
              className="p-1.5 text-slate-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
              title="Paylaş"
            >
              <Share2 size={16} />
            </button>
          </div>
        </div>
      </div>
    </article>
  )
}
