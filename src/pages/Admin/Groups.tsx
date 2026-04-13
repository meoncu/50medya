import { useState, useMemo } from 'react'
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
import { GripVertical, Plus, Trash2, Edit2, Check, X, Eye, EyeOff, FolderPlus, ChevronRight, ChevronDown } from 'lucide-react'
import { addGroup, updateGroup, deleteGroup, seedDefaultGroups } from '../../services/groups'
import { useStore } from '../../store'
import { cn } from '../../lib/utils'
import type { Group } from '../../types'
import { GroupSelect } from '../../components/ui/GroupSelect'

function SortableGroup({
  group,
  isChild,
  hasChildren,
  isExpanded,
  onEdit,
  onDelete,
  onToggle,
  onAddSub,
  onExpandToggle,
}: {
  group: Group
  isChild?: boolean
  hasChildren?: boolean
  isExpanded?: boolean
  onEdit: (g: Group) => void
  onDelete: (id: string) => void
  onToggle: (g: Group) => void
  onAddSub: (parentId: string) => void
  onExpandToggle?: (id: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: group.id })
  const style = { 
    transform: CSS.Transform.toString(transform), 
    transition,
    marginLeft: isChild ? '2.5rem' : '0'
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white rounded-2xl border ${isChild ? 'border-dashed border-slate-200 bg-slate-50/50' : 'border-slate-200'} p-3 flex items-center gap-3 group/row transition-all hover:border-primary-200 shadow-sm`}
    >
      <button {...attributes} {...listeners} className="cursor-grab text-slate-300 hover:text-slate-500 touch-none">
        <GripVertical size={18} />
      </button>
      
      {!isChild && hasChildren && (
        <button 
          onClick={() => onExpandToggle?.(group.id)}
          className={cn("p-1 rounded-lg hover:bg-slate-100 transition-transform duration-200", isExpanded && "rotate-180")}
        >
          <ChevronDown size={14} className="text-slate-400" />
        </button>
      )}

      {isChild && <ChevronRight size={14} className="text-slate-300 ml-1" />}
      
      <span className="text-xl">{group.icon}</span>
      <div className="flex-1 flex flex-col">
        <span className={`text-sm font-bold ${isChild ? 'text-slate-600' : 'text-slate-800'}`}>
          {group.name}
        </span>
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover/row:opacity-100 transition-opacity">
        {!isChild && (
          <button
            onClick={() => onAddSub(group.id)}
            className="p-1.5 text-primary-500 hover:bg-primary-50 rounded-lg transition-colors"
            title="Alt Grup Ekle"
          >
            <FolderPlus size={16} />
          </button>
        )}
        <button
          onClick={() => onToggle(group)}
          className={`p-1.5 rounded-lg transition-colors ${group.visible ? 'text-green-600 hover:bg-green-50' : 'text-slate-400 hover:bg-slate-100'}`}
          title={group.visible ? 'Gizle' : 'Göster'}
        >
          {group.visible ? <Eye size={16} /> : <EyeOff size={16} />}
        </button>
        <button
          onClick={() => onEdit(group)}
          className="p-1.5 text-slate-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
          title="Düzenle"
        >
          <Edit2 size={16} />
        </button>
        <button
          onClick={() => onDelete(group.id)}
          className="p-1.5 text-red-400 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
          title="Sil"
        >
          <Trash2 size={16} />
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
  const [parentId, setParentId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({})
  const [searchQuery, setSearchQuery] = useState('')

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => ({ ...prev, [id]: !prev[id] }))
  }

  // Hierarchical groups for rendering with collapse/expand logic
  const sortedHierarchicalGroups = useMemo(() => {
    let baseGroups = groups
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      baseGroups = groups.filter(g => 
        g.name.toLowerCase().includes(q) || 
        g.icon.includes(q)
      )
      // If searching, show as flat list or find parents? 
      // Simplified: filter and show
      return baseGroups.map(g => ({
        group: g,
        isChild: false,
        hasChildren: false,
        isExpanded: false
      }))
    }

    const roots = baseGroups.filter(g => !g.parentId)
    const children = baseGroups.filter(g => g.parentId)
    
    let result: { group: Group, isChild: boolean, hasChildren: boolean, isExpanded: boolean }[] = []
    
    roots.forEach(root => {
      const subGroups = children.filter(c => c.parentId === root.id)
      const isExpanded = !!expandedIds[root.id]
      
      result.push({ 
        group: root, 
        isChild: false, 
        hasChildren: subGroups.length > 0,
        isExpanded
      })

      if (isExpanded) {
        subGroups.forEach(sub => {
          result.push({ 
            group: sub, 
            isChild: true, 
            hasChildren: false,
            isExpanded: false
          })
        })
      }
    })
    
    // Add orphaned or hidden groups
    const processedIds = new Set(result.map(r => r.group.id))
    groups.filter(g => !processedIds.has(g.id)).forEach(g => {
       const isRoot = !g.parentId
       const subCount = groups.filter(c => c.parentId === g.id).length
       result.push({ 
         group: g, 
         isChild: !isRoot, 
         hasChildren: isRoot && subCount > 0,
         isExpanded: isRoot && !!expandedIds[g.id]
       })
    })

    return result
  }, [groups, expandedIds, searchQuery])

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    
    // Simplistic DND order - based on the visual list order when dragging
    const oldIndex = sortedHierarchicalGroups.findIndex((g) => g.group.id === active.id)
    const newIndex = sortedHierarchicalGroups.findIndex((g) => g.group.id === over.id)
    
    const reordered = arrayMove(groups, oldIndex, newIndex)
    setGroups(reordered)
    await Promise.all(reordered.map((g, i) => updateGroup(g.id, { order: i })))
  }

  async function handleSave() {
    if (!name.trim()) return
    setSaving(true)
    try {
      if (editGroup) {
        await updateGroup(editGroup.id, { name: name.trim(), icon, parentId })
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
      resetForm()
    } finally {
      setSaving(false)
    }
  }

  function resetForm() {
    setShowForm(false)
    setEditGroup(null)
    setName('')
    setIcon('📁')
    setParentId(null)
  }

  function startEdit(g: Group) {
    setEditGroup(g)
    setName(g.name)
    setIcon(g.icon)
    setParentId(g.parentId || null)
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function startAddSub(pid: string) {
    setEditGroup(null)
    setName('')
    setIcon('📁')
    setParentId(pid)
    setShowForm(true)
    setExpandedIds(prev => ({ ...prev, [pid]: true }))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleDelete(id: string) {
    const hasChildren = groups.some(g => g.parentId === id)
    if (hasChildren) {
       alert('Bu grubun alt grupları var. Önce onları silmelisiniz.')
       return
    }
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
      <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
        <div className="relative flex-1 group w-full">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Gruplarda ara..."
            className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-400 transition-all shadow-sm"
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          {groups.length === 0 && (
            <button
              onClick={handleSeed}
              className="flex-1 sm:flex-none px-4 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50"
            >
              Varsayılanlar
            </button>
          )}
          <button
            onClick={() => { setShowForm(true); setEditGroup(null); setName(''); setIcon('📁'); setParentId(null) }}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-primary-500 text-white text-sm font-bold rounded-xl hover:bg-primary-600 transition-colors shadow-sm"
          >
            <Plus size={16} />
            Yeni Grup
          </button>
        </div>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-6 shadow-md ring-2 ring-primary-500/10 scale-in-center">
          <h2 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
             {editGroup ? <Edit2 size={18} className="text-primary-500" /> : <Plus size={18} className="text-primary-500" />}
             {editGroup ? 'Grubu Düzenle' : 'Yeni Grup'}
          </h2>
          
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
              />
            </div>
          </div>

          <div className="mb-5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1 block mb-1">Üst Grup</label>
            <GroupSelect
              groups={groups.filter(g => g.id !== editGroup?.id && !g.parentId)}
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
              {editGroup ? 'Güncelle' : 'Kaydet'}
            </button>
            <button
              onClick={resetForm}
              className="px-6 py-2.5 text-slate-500 font-bold text-sm hover:bg-slate-100 rounded-xl"
            >
              Vazgeç
            </button>
          </div>
        </div>
      )}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={sortedHierarchicalGroups.map(r => r.group.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2 pb-20">
            {sortedHierarchicalGroups.map((row) => (
              <SortableGroup
                key={row.group.id}
                group={row.group}
                isChild={row.isChild}
                hasChildren={row.hasChildren}
                isExpanded={row.isExpanded}
                onEdit={startEdit}
                onDelete={handleDelete}
                onToggle={handleToggle}
                onAddSub={startAddSub}
                onExpandToggle={toggleExpand}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  )
}
