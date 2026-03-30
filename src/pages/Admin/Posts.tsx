import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Plus, Trash2, Edit2, Check, X, Eye, EyeOff, RefreshCw } from 'lucide-react'
import { getAllPosts, addPost, updatePost, deletePost } from '../../services/posts'
import { fetchLinkPreview } from '../../services/linkPreview'
import { useStore } from '../../store'
import type { Post } from '../../types'
import { platformLabel, platformColor, timeAgo, getHierarchicalGroups } from '../../lib/utils'

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
  const [editingPostId, setEditingPostId] = useState<string | null>(null)
  
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
      if (editingPostId) {
        // Update existing post
        await updatePost(editingPostId, {
          title: preview?.title || '',
          description: preview?.description || '',
          thumbnail: preview?.thumbnail || '',
          groupId: selectedGroupId || null,
        })
      } else {
        // Create new post
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
      }
      
      resetForm()
      await load()
    } catch (err) {
      console.error('Save error:', err)
      alert('Kaydedilirken bir hata oluştu.')
    } finally {
      setSaving(false)
    }
  }

  function handleEdit(post: Post) {
    setEditingPostId(post.id)
    setUrl(post.url)
    setPreview({
      title: post.title,
      description: post.description,
      thumbnail: post.thumbnail,
      platform: post.platform
    })
    setSelectedGroupId(post.groupId || '')
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function resetForm() {
    setUrl('')
    setPreview(null)
    setSelectedGroupId('')
    setShowForm(false)
    setEditingPostId(null)
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
          onClick={() => { if(showForm) resetForm(); else setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white text-sm font-medium rounded-xl hover:bg-primary-600 transition-colors"
        >
          {showForm ? <X size={16} /> : <Plus size={16} />}
          {showForm ? 'Kapat' : 'Yeni Post'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-6 shadow-sm ring-2 ring-primary-500/10 scale-in-center">
          <h2 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            {editingPostId ? <Edit2 size={18} className="text-primary-500" /> : <Plus size={18} className="text-primary-500" />}
            {editingPostId ? 'Postu Düzenle' : 'Yeni Post Ekle'}
          </h2>

          <div className="flex gap-2 mb-3">
            <input
              disabled={!!editingPostId}
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Sosyal medya linki yapıştırın..."
              className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 disabled:opacity-50"
              onKeyDown={(e) => e.key === 'Enter' && !editingPostId && handleFetchPreview()}
            />
            {!editingPostId && (
              <button
                onClick={handleFetchPreview}
                disabled={fetching}
                className="px-4 py-2 bg-primary-50 text-primary-600 text-sm font-bold rounded-xl hover:bg-primary-100 transition-colors disabled:opacity-60"
              >
                {fetching ? '...' : 'Önizle'}
              </button>
            )}
          </div>

          {preview && (
            <div className="border border-slate-200 rounded-xl overflow-hidden mb-4 bg-slate-50/30">
              {preview.thumbnail && (
                <img
                  src={preview.thumbnail}
                  alt=""
                  className="w-full h-40 object-cover"
                  referrerPolicy="no-referrer"
                />
              )}
              <div className="p-4 space-y-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Başlık</label>
                  <input
                    value={preview.title || ''}
                    onChange={(e) => setPreview({ ...preview, title: e.target.value })}
                    className="w-full text-sm font-bold text-slate-800 bg-white border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-primary-100 focus:border-primary-400 outline-none"
                    placeholder="Başlık"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Açıklama</label>
                  <textarea
                    value={preview.description || ''}
                    onChange={(e) => setPreview({ ...preview, description: e.target.value })}
                    className="w-full text-xs text-slate-600 bg-white border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-primary-100 focus:border-primary-400 outline-none resize-none"
                    rows={3}
                    placeholder="Açıklama"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-2 items-center">
            <select
              value={selectedGroupId}
              onChange={(e) => setSelectedGroupId(e.target.value)}
              className="flex-1 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
            >
              <option value="">Grup (Kategori) Seçin</option>
              {getHierarchicalGroups(groups).map((g) => (
                <option key={g.id} value={g.id}>
                  {g.displayLabel}
                </option>
              ))}
            </select>

            <button
              onClick={handleSave}
              disabled={!url.trim() || saving || (fetching && !editingPostId)}
              className="flex items-center gap-2 px-6 py-2 bg-primary-600 text-white text-sm font-bold rounded-xl hover:bg-primary-700 transition-all shadow-md active:scale-95 disabled:opacity-50"
            >
              {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Check size={18} />}
              {editingPostId ? 'Güncelle' : 'Kaydet'}
            </button>
            <button
              onClick={resetForm}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Vazgeç
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
              <div key={post.id} className="bg-white rounded-2xl border border-slate-200 p-3 flex items-center gap-3 hover:border-primary-200 transition-colors group">
                {post.thumbnail && (
                  <img src={post.thumbnail} alt="" className="w-14 h-14 rounded-xl object-cover shrink-0 shadow-sm" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{post.title || post.url}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${platformColor(post.platform)}`}>
                      {platformLabel(post.platform)}
                    </span>
                    {group && (
                      <span className="text-xs bg-slate-50 text-slate-500 px-2 py-0.5 rounded-lg border border-slate-100">
                        {group.icon} {group.name}
                      </span>
                    )}
                    <span className="text-[10px] text-slate-400 font-medium">{timeAgo(post.createdAt)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleSyncMetadata(post)}
                    disabled={syncingId === post.id}
                    className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors disabled:opacity-50"
                    title="Bilgileri Yenile"
                  >
                    <RefreshCw size={16} className={syncingId === post.id ? 'animate-spin' : ''} />
                  </button>
                  <button
                    onClick={() => handleEdit(post)}
                    className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                    title="Düzenle"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleTogglePublish(post)}
                    className={`p-2 rounded-lg transition-colors ${post.published ? 'text-green-600 hover:bg-green-50' : 'text-slate-400 hover:bg-slate-100'}`}
                    title={post.published ? 'Gizle' : 'Yayınla'}
                  >
                    {post.published ? <Eye size={16} /> : <EyeOff size={16} />}
                  </button>
                  <button
                    onClick={() => handleDelete(post.id)}
                    className="p-2 text-red-400 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
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
