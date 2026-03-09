import { useState } from 'react'
import { useStore } from '../../store'
import { seedDefaultGroups } from '../../services/groups'

export function AdminSettings() {
  const user = useStore((s) => s.user)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('')

  async function handleSeed() {
    if (!confirm('Varsayılan grupları eklemek istediğinize emin misiniz?')) return
    setLoading(true)
    setStatus('')
    try {
      await seedDefaultGroups()
      setStatus('Gruplar başarıyla eklendi.')
    } catch (e: unknown) {
      console.error(e)
      setStatus('Hata oluştu.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 max-w-lg">
      <h1 className="text-xl font-bold text-slate-800 mb-6">Ayarlar</h1>

      <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-4">
        <h2 className="font-semibold text-slate-700 mb-3">Hesap Bilgileri</h2>
        <div className="flex items-center gap-3">
          <img
            src={user?.photoURL || '/icons/icon-192.png'}
            alt={user?.displayName}
            className="w-12 h-12 rounded-full border-2 border-primary-200"
          />
          <div>
            <p className="font-medium text-slate-800">{user?.displayName}</p>
            <p className="text-sm text-slate-500">{user?.email}</p>
            {user?.isAdmin && (
              <span className="text-xs px-2 py-0.5 bg-primary-100 text-primary-700 rounded-full font-medium">
                Yönetici
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-4">
        <h2 className="font-semibold text-slate-700 mb-2">Veritabanı Araçları</h2>
        <p className="text-xs text-slate-500 mb-4">Başlangıç grupları bulunmuyorsa buradan ekleyebilirsiniz.</p>
        <button
          onClick={handleSeed}
          disabled={loading}
          className="w-full bg-slate-100 text-slate-700 px-4 py-2 rounded-xl text-sm font-medium hover:bg-slate-200 transition-colors disabled:opacity-50"
        >
          {loading ? 'İşleniyor...' : 'Varsayılan Grupları Oluştur'}
        </button>
        {status && <p className="text-xs mt-2 text-primary-600">{status}</p>}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-4">
        <h2 className="font-semibold text-slate-700 mb-3">Uygulama Hakkında</h2>
        <div className="space-y-2 text-sm text-slate-600">
          <div className="flex justify-between">
            <span>Uygulama Adı</span>
            <span className="font-medium">50 Medya</span>
          </div>
          <div className="flex justify-between">
            <span>Versiyon</span>
            <span className="font-medium">1.0.0</span>
          </div>
          <div className="flex justify-between">
            <span>Platform</span>
            <span className="font-medium">PWA / Web</span>
          </div>
        </div>
      </div>
    </div>
  )
}
