import { useState, useEffect } from 'react'
import { Plus, Edit2, Check, X } from 'lucide-react'
import { addGroup, updateGroup } from '../../services/groups'
import { useStore } from '../../store'
import { GroupSelect } from '../ui/GroupSelect'
import type { Group } from '../../types'

interface GroupModalProps {
  isOpen: boolean
  onClose: () => void
  groupToEdit?: Group | null
  initialParentId?: string | null
}

export function GroupModal({ isOpen, onClose, groupToEdit, initialParentId }: GroupModalProps) {
  const groups = useStore((s) => s.groups)
  const [name, setName] = useState('')
  const [icon, setIcon] = useState('📁')
  const [parentId, setParentId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (isOpen) {
      if (groupToEdit) {
        setName(groupToEdit.name)
        setIcon(groupToEdit.icon)
        setParentId(groupToEdit.parentId || null)
      } else {
        setName('')
        setIcon('📁')
        setParentId(initialParentId || null)
      }
    }
  }, [isOpen, groupToEdit, initialParentId])

  if (!isOpen) return null

  async function handleSave() {
    if (!name.trim()) return
    setSaving(true)
    try {
      if (groupToEdit) {
        await updateGroup(groupToEdit.id, { name: name.trim(), icon, parentId })
      } else {
        const slug = name.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
        await addGroup({
          name: name.trim(),
          slug,
          icon,
          order: groups.length,
          visible: true,
          parentId,
          createdAt: new Date(),
        })
      }
      onClose()
    } finally {
      setSaving(false)
    }
  }

  // Prevent selecting itself or its children as parent (simple check: just exclude itself)
  const availableParents = groups.filter(g => g.id !== groupToEdit?.id && !g.parentId)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden scale-in-center">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-slate-800 flex items-center gap-2">
             {groupToEdit ? <Edit2 size={18} className="text-primary-500" /> : <Plus size={18} className="text-primary-500" />}
             {groupToEdit ? 'Grubu Düzenle' : 'Yeni Grup Ekle'}
          </h2>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        
        <div className="p-5">
          <div className="grid grid-cols-4 gap-4 mb-4">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">İkon</label>
              <input
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                className="w-full text-center text-2xl px-2 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-400 transition-all"
                placeholder="📁"
                maxLength={2}
              />
            </div>
            <div className="col-span-3 flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Grup Adı</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Örn: Namaz..."
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-400 transition-all"
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                autoFocus
              />
            </div>
          </div>

          <div className="mb-5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1 block mb-1">Üst Grup</label>
            <GroupSelect
              groups={availableParents}
              value={parentId || ''}
              onChange={(v) => setParentId(v || null)}
              placeholder="(Ana Grup - Üst grup yok)"
              className="w-full"
              triggerClassName="h-[46px]"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving || !name.trim()}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-2.5 bg-primary-600 text-white text-sm font-bold rounded-xl hover:bg-primary-700 disabled:opacity-50 shadow-sm transition-all"
            >
              {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Check size={18} />}
              {groupToEdit ? 'Güncelle' : 'Kaydet'}
            </button>
            <button
              onClick={onClose}
              className="px-6 py-2.5 text-slate-500 font-bold text-sm hover:bg-slate-100 rounded-xl"
            >
              İptal
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
