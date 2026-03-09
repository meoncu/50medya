import { create } from 'zustand'
import type { User, Post, Group } from '../types'

interface AppStore {
  user: User | null
  authLoading: boolean
  setUser: (user: User | null) => void
  setAuthLoading: (v: boolean) => void

  posts: Post[]
  setPosts: (posts: Post[]) => void

  groups: Group[]
  setGroups: (groups: Group[]) => void

  selectedGroupId: string | null
  setSelectedGroupId: (id: string | null) => void
}

export const useStore = create<AppStore>((set) => ({
  user: null,
  authLoading: true,
  setUser: (user) => set({ user }),
  setAuthLoading: (v) => set({ authLoading: v }),

  posts: [],
  setPosts: (posts) => set({ posts }),

  groups: [],
  setGroups: (groups) => set({ groups }),

  selectedGroupId: null,
  setSelectedGroupId: (id) => set({ selectedGroupId: id }),
}))
