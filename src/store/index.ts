import { create } from 'zustand'
import type { User, Post, Group } from '../types'

interface AppStore {
  user: User | null
  setUser: (user: User | null) => void

  posts: Post[]
  setPosts: (posts: Post[]) => void

  groups: Group[]
  setGroups: (groups: Group[]) => void

  selectedGroupId: string | null
  setSelectedGroupId: (id: string | null) => void
}

export const useStore = create<AppStore>((set) => ({
  user: null,
  setUser: (user) => set({ user }),

  posts: [],
  setPosts: (posts) => set({ posts }),

  groups: [],
  setGroups: (groups) => set({ groups }),

  selectedGroupId: null,
  setSelectedGroupId: (id) => set({ selectedGroupId: id }),
}))
