import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Plus, Trash2, Edit2, Check, X, Eye, EyeOff, RefreshCw } from 'lucide-react'
import { getAllPosts, addPost, updatePost, deletePost } from '../../services/posts'
import { fetchLinkPreview } from '../../services/linkPreview'
import { useStore } from '../../store'
import type { Post } from '../../types'
import { platformLabel, platformColor, timeAgo } from '../../lib/utils'

export function AdminPosts() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [url, setUrl] = useState('')
  const [preview, setPreview] = useState<Partial<Post> | null>(null)
  const [selectedGroupId, setSelectedGroupId] = useState<string>('')
  const [fetching, setFetching] = useState(false)
  const [saving, setSaving] = useState(false)
  const [syncingId, setSyncingId] = useState<string | null>(null)
  const groups = useStore((s) => s.groups)
  const user = useStore((s) => s.user)

  async function load() {
    setLoading(true)
    const p = await getAllPosts()
    setPosts(p)
    setLoading(false)
  }

  const location = useLocation()

  useEffect(() => { 
    load() 
    if (location.state?.addPost) {
      setShowForm(true)
    }
  }, [location.state])

  async function handleFetchPreview() {
    if (!url.trim()) return
    setFetching(true)
    try {
      const result = await fetchLinkPreview(url.trim())
      setPreview(result)
    } finally {
      setFetching(false)
    }
  }

  async function handleSave() {
    if (!url.trim() || !user) return
    setSaving(true)
    try {
      let finalPreview = preview
      if (!finalPreview) {
        finalPreview = await fetchLinkPreview(url.trim())
      }

      await addPost({
        url: finalPreview?.url || url.trim(),
        platform: finalPreview?.platform || 'other',
        title: finalPreview?.title || '',
        description: finalPreview?.description || '',
        thumbnail: finalPreview?.thumbnail || '',
        mediaType: finalPreview?.mediaType || 'unknown',
        groupId: selectedGroupId || null,
        createdAt: new Date(),
        createdBy: user.uid,
        published: true,
      })
      setUrl('')
      setPreview(null)
      setSelectedGroupId('')
      setShowForm(false)
      await load()
    } catch (err) {
      console.error('Save error:', err)
      alert('Kaydedilirken bir hata oluştu.')
    } finally {
      setSaving(false)
    }
  }

  async function handleTogglePublish(post: Post) {
    await updatePost(post.id, { published: !post.published })
    await load()
  }

  async function handleDelete(id: string) {
    if (!confirm('Bu postu silmek istediğinize emin misiniz?')) return
    await deletePost(id)
    await load()
  }

  async function handleSyncMetadata(post: Post) {
    if (syncingId === post.id) return
    setSyncingId(post.id)
    try {
      const result = await fetchLinkPreview(`${post.url}&t=${Date.now()}`)
      if (result) {
        const updates = {
          title: result.title || post.title,
          description: result.description || post.description,
          thumbnail: result.thumbnail || post.thumbnail,
          mediaType: result.mediaType || post.mediaType,
          platform: result.platform || post.platform
        }
        await updatePost(post.id, updates)
        await load()
      }
    } catch (err) {
      console.error('Manual sync error:', err)
      alert('Bilgiler güncellenemedi.')
    } finally {
      setSyncingId(null)
    }
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-slate-800">Post Yönetimi</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white text-sm font-medium rounded-xl hover:bg-primary-600 transition-colors"
        >
          <Plus size={16} />
          Yeni Post
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-6 shadow-sm">
          <h2 className="font-semibold text-slate-700 mb-3">Yeni Post Ekle</h2>

          <div className="flex gap-2 mb-3">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Sosyal medya linki yapıştırın..."
              className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-200"
              onKeyDown={(e) => e.key === 'Enter' && handleFetchPreview()}
            />
            <button
              onClick={handleFetchPreview}
              disabled={fetching}
              className="px-4 py-2 bg-slate-100 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-200 transition-colors disabled:opacity-60"
            >
              {fetching ? '...' : 'Önizle'}
            </button>
          </div>

          {preview && (
            <div className="border border-slate-200 rounded-xl overflow-hidden mb-3">
              {preview.thumbnail && (
                <img
                  src={preview.thumbnail}
                  alt=""
                  className="w-full h-40 object-cover"
                  referrerPolicy="no-referrer"
                />
              )}
              <div className="p-3">
                <input
                  value={preview.title || ''}
                  onChange={(e) => setPreview({ ...preview, title: e.target.value })}
                  className="w-full text-sm font-semibold text-slate-800 border-b border-slate-100 pb-1 mb-1 focus:outline-none"
                  placeholder="Başlık"
                />
                <textarea
                  value={preview.description || ''}
                  onChange={(e) => setPreview({ ...preview, description: e.target.value })}
                  className="w-full text-xs text-slate-500 focus:outline-none resize-none"
                  rows={2}
                  placeholder="Açıklama"
                />
              </div>
            </div>
          )}

          <div className="flex gap-2 items-center">
            <select
              value={selectedGroupId}
              onChange={(e) => setSelectedGroupId(e.target.value)}
              className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-primary-400"
            >
              <option value="">Grup seçin (opsiyonel)</option>
              {groups.map((g) => {
                const parent = g.parentId ? groups.find(p => p.id === g.parentId) : null
                const prefix = parent ? `${parent.name} > ` : ''
                return (
                  <option key={g.id} value={g.id}>
                    {prefix}{g.icon} {g.name}
                  </option>
                )
              })}
            </select>

            <button
              onClick={handleSave}
              disabled={!url.trim() || saving || fetching}
              className="flex items-center gap-1.5 px-4 py-2 bg-primary-500 text-white text-sm font-medium rounded-xl hover:bg-primary-600 transition-colors disabled:opacity-60"
            >
              <Check size={15} />
              {saving ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
            <button
              onClick={() => { setShowForm(false); setPreview(null); setUrl('') }}
              className="p-2 text-slate-500 hover:bg-slate-100 rounded-xl"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 bg-white rounded-2xl border border-slate-200 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {posts.map((post) => {
            const group = groups.find((g) => g.id === post.groupId)
            return (
              <div key={post.id} className="bg-white rounded-2xl border border-slate-200 p-3 flex items-center gap-3">
                {post.thumbnail && (
                  <img src={post.thumbnail} alt="" className="w-14 h-14 rounded-xl object-cover shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{post.title || post.url}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${platformColor(post.platform)}`}>
                      {platformLabel(post.platform)}
                    </span>
                    {group && (
                      <span className="text-xs text-slate-500">{group.icon} {group.name}</span>
                    )}
                    <span className="text-xs text-slate-400">{timeAgo(post.createdAt)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleSyncMetadata(post)}
                    disabled={syncingId === post.id}
                    className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors disabled:opacity-50"
                    title="Bilgileri Güncelle"
                  >
                    <RefreshCw size={16} className={syncingId === post.id ? 'animate-spin' : ''} />
                  </button>
                  <button
                    onClick={() => handleTogglePublish(post)}
                    className={`p-1.5 rounded-lg transition-colors ${post.published ? 'text-green-600 hover:bg-green-50' : 'text-slate-400 hover:bg-slate-100'}`}
                    title={post.published ? 'Gizle' : 'Yayınla'}
                  >
                    {post.published ? <Eye size={16} /> : <EyeOff size={16} />}
                  </button>
                  <button
                    onClick={() => handleDelete(post.id)}
                    className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Sil"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
