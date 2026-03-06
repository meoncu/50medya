import { useState } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Plus, Trash2, Edit2, Check, X, Eye, EyeOff } from 'lucide-react'
import { addGroup, updateGroup, deleteGroup, seedDefaultGroups } from '../../services/groups'
import { useStore } from '../../store'
import type { Group } from '../../types'

function SortableGroup({
  group,
  onEdit,
  onDelete,
  onToggle,
}: {
  group: Group
  onEdit: (g: Group) => void
  onDelete: (id: string) => void
  onToggle: (g: Group) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: group.id })
  const style = { transform: CSS.Transform.toString(transform), transition }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white rounded-2xl border border-slate-200 p-3 flex items-center gap-3"
    >
      <button {...attributes} {...listeners} className="cursor-grab text-slate-300 hover:text-slate-500 touch-none">
        <GripVertical size={18} />
      </button>
      <span className="text-xl">{group.icon}</span>
      <span className="flex-1 text-sm font-medium text-slate-800">{group.name}</span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onToggle(group)}
          className={`p-1.5 rounded-lg transition-colors ${group.visible ? 'text-green-600 hover:bg-green-50' : 'text-slate-400 hover:bg-slate-100'}`}
        >
          {group.visible ? <Eye size={15} /> : <EyeOff size={15} />}
        </button>
        <button
          onClick={() => onEdit(group)}
          className="p-1.5 text-slate-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
        >
          <Edit2 size={15} />
        </button>
        <button
          onClick={() => onDelete(group.id)}
          className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  )
}

export function AdminGroups() {
  const groups = useStore((s) => s.groups)
  const setGroups = useStore((s) => s.setGroups)
  const [showForm, setShowForm] = useState(false)
  const [editGroup, setEditGroup] = useState<Group | null>(null)
  const [name, setName] = useState('')
  const [icon, setIcon] = useState('📁')
  const [saving, setSaving] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = groups.findIndex((g) => g.id === active.id)
    const newIndex = groups.findIndex((g) => g.id === over.id)
    const newOrder = arrayMove(groups, oldIndex, newIndex)
    setGroups(newOrder)
    await Promise.all(newOrder.map((g, i) => updateGroup(g.id, { order: i })))
  }

  async function handleSave() {
    if (!name.trim()) return
    setSaving(true)
    try {
      if (editGroup) {
        await updateGroup(editGroup.id, { name: name.trim(), icon })
      } else {
        const slug = name.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
        await addGroup({
          name: name.trim(),
          slug,
          icon,
          order: groups.length,
          visible: true,
          createdAt: new Date(),
        })
      }
      setShowForm(false)
      setEditGroup(null)
      setName('')
      setIcon('📁')
    } finally {
      setSaving(false)
    }
  }

  function startEdit(g: Group) {
    setEditGroup(g)
    setName(g.name)
    setIcon(g.icon)
    setShowForm(true)
  }

  async function handleDelete(id: string) {
    if (!confirm('Bu grubu silmek istediğinize emin misiniz?')) return
    await deleteGroup(id)
  }

  async function handleToggle(g: Group) {
    await updateGroup(g.id, { visible: !g.visible })
  }

  async function handleSeed() {
    if (!confirm('Varsayılan gruplar eklensin mi?')) return
    await seedDefaultGroups()
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-slate-800">Grup Yönetimi</h1>
        <div className="flex gap-2">
          {groups.length === 0 && (
            <button
              onClick={handleSeed}
              className="px-3 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50"
            >
              Varsayılanları Ekle
            </button>
          )}
          <button
            onClick={() => { setShowForm(true); setEditGroup(null); setName(''); setIcon('📁') }}
            className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white text-sm font-medium rounded-xl hover:bg-primary-600 transition-colors"
          >
            <Plus size={16} />
            Yeni Grup
          </button>
        </div>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-4 shadow-sm">
          <h2 className="font-semibold text-slate-700 mb-3">
            {editGroup ? 'Grubu Düzenle' : 'Yeni Grup'}
          </h2>
          <div className="flex gap-2 mb-3">
            <input
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              className="w-14 text-center text-xl px-2 py-2 border border-slate-200 rounded-xl focus:outline-none"
              placeholder="📁"
              maxLength={2}
            />
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Grup adı"
              className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-primary-400"
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 bg-primary-500 text-white text-sm font-medium rounded-xl hover:bg-primary-600 disabled:opacity-60"
            >
              <Check size={15} />
              {saving ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
            <button
              onClick={() => { setShowForm(false); setEditGroup(null) }}
              className="p-2 text-slate-500 hover:bg-slate-100 rounded-xl"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      <p className="text-xs text-slate-400 mb-3">Sıralamak için sürükleyin</p>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={groups.map((g) => g.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {groups.map((g) => (
              <SortableGroup
                key={g.id}
                group={g}
                onEdit={startEdit}
                onDelete={handleDelete}
                onToggle={handleToggle}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  )
}
