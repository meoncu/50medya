import { useState, useRef, useEffect } from 'react'
import { Check, ChevronDown, Search } from 'lucide-react'
import { cn, getHierarchicalGroups } from '../../lib/utils'
import type { Group } from '../../types'

interface GroupSelectProps {
  groups: Group[]
  value: string
  onChange: (groupId: string) => void
  disabled?: boolean
  className?: string
  triggerClassName?: string
  placeholder?: string
}

export function GroupSelect({ groups, value, onChange, disabled, className, triggerClassName, placeholder = "Grup (Kategori) Seçin" }: GroupSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  const hierarchical = getHierarchicalGroups(groups)
  
  const filtered = hierarchical.filter(g => 
    g.displayLabel.toLowerCase().includes(search.toLowerCase())
  )

  const selectedNode = hierarchical.find(g => g.id === value)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className={cn("relative min-w-[200px]", className)} ref={containerRef}>
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={cn(
          "flex items-center justify-between w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium cursor-pointer transition-all",
          triggerClassName,
          disabled && "opacity-50 cursor-not-allowed",
          isOpen && "border-primary-400 ring-2 ring-primary-100"
        )}
      >
        <span className={selectedNode ? "text-slate-800" : "text-slate-400 truncate pr-2"}>
          {selectedNode ? selectedNode.displayLabel : placeholder}
        </span>
        <ChevronDown size={16} className={cn("text-slate-400 transition-transform shrink-0", isOpen && "rotate-180")} />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          <div className="p-3 border-b border-slate-200 flex items-center gap-2 text-slate-500 bg-white">
            <Search size={18} className="shrink-0" />
            <input
              autoFocus
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Grup ara..."
              className="w-full bg-transparent text-sm text-slate-900 focus:outline-none h-10"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div className="max-h-60 overflow-y-auto p-1">
            <div
              onClick={() => {
                onChange('');
                setIsOpen(false);
                setSearch('');
              }}
              className={cn(
                "w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-slate-100 transition-colors cursor-pointer text-slate-500",
                !value && "bg-slate-100 font-bold text-slate-800"
              )}
            >
              {placeholder}
            </div>
            {filtered.length === 0 ? (
              <div className="p-3 text-center text-sm text-slate-500">Bulunamadı</div>
            ) : (
              filtered.map((g) => (
                <div
                  key={g.id}
                  onClick={() => {
                    onChange(g.id);
                    setIsOpen(false);
                    setSearch('');
                  }}
                  className={cn(
                    "w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-primary-50 transition-colors flex items-center justify-between cursor-pointer",
                    value === g.id ? "bg-primary-50 text-primary-700 font-bold" : "text-slate-700"
                  )}
                >
                  <span className="truncate">{g.displayLabel}</span>
                  {value === g.id && <Check size={16} className="shrink-0" />}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
