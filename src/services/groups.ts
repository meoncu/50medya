import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  Timestamp,
  type DocumentData,
} from 'firebase/firestore'
import { db } from './firebase'
import type { Group } from '../types'

function toGroup(id: string, data: DocumentData): Group {
  return {
    id,
    name: data.name,
    slug: data.slug,
    order: data.order ?? 0,
    icon: data.icon ?? '📁',
    visible: data.visible ?? true,
    parentId: data.parentId ?? null,
    createdAt: (data.createdAt as Timestamp)?.toDate() ?? new Date(),
  }
}

export async function addGroup(group: Omit<Group, 'id'>): Promise<string> {
  const ref = await addDoc(collection(db, 'groups'), {
    ...group,
    createdAt: Timestamp.fromDate(group.createdAt),
  })
  return ref.id
}

export async function updateGroup(id: string, data: Partial<Group>): Promise<void> {
  await updateDoc(doc(db, 'groups', id), data)
}

export async function deleteGroup(id: string): Promise<void> {
  await deleteDoc(doc(db, 'groups', id))
}

export function subscribeToGroups(callback: (groups: Group[]) => void) {
  const q = query(collection(db, 'groups'), orderBy('order', 'asc'))
  return onSnapshot(
    q,
    (snap) => {
      callback(snap.docs.map((d) => toGroup(d.id, d.data())))
    },
    (error) => {
      console.error('Error in subscribeToGroups:', error)
      callback([])
    }
  )
}

export async function seedDefaultGroups(): Promise<void> {
  const defaults = [
    { name: 'Sağlık', slug: 'saglik', icon: '🏥', order: 0 },
    { name: 'Ekonomi', slug: 'ekonomi', icon: '💰', order: 1 },
    { name: 'Tarih', slug: 'tarih', icon: '📜', order: 2 },
    { name: 'Eğlence', slug: 'eglence', icon: '🎉', order: 3 },
    { name: 'Namaz', slug: 'namaz', icon: '🕌', order: 4 },
    { name: 'Sünnet', slug: 'sunnet', icon: '📖', order: 5 },
    { name: 'İlmihal', slug: 'ilmihal', icon: '📚', order: 6 },
  ]
  for (const g of defaults) {
    await addDoc(collection(db, 'groups'), {
      ...g,
      visible: true,
      createdAt: Timestamp.now(),
    })
  }
}
