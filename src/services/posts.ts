import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
  type Query,
  type DocumentData,
} from 'firebase/firestore'
import { db } from './firebase'
import type { Post } from '../types'

function toPost(id: string, data: DocumentData): Post {
  return {
    id,
    url: data.url,
    platform: data.platform,
    title: data.title,
    description: data.description,
    thumbnail: data.thumbnail,
    mediaType: data.mediaType,
    groupId: data.groupId ?? null,
    createdAt: (data.createdAt as Timestamp)?.toDate() ?? new Date(),
    createdBy: data.createdBy,
    published: data.published ?? true,
  }
}

export async function addPost(post: Omit<Post, 'id'>): Promise<string> {
  const ref = await addDoc(collection(db, 'posts'), {
    ...post,
    createdAt: Timestamp.fromDate(post.createdAt),
  })
  return ref.id
}

export async function updatePost(id: string, data: Partial<Post>): Promise<void> {
  await updateDoc(doc(db, 'posts', id), data)
}

export async function deletePost(id: string): Promise<void> {
  await deleteDoc(doc(db, 'posts', id))
}

export async function getPostsByGroup(groupId: string): Promise<Post[]> {
  const q = query(
    collection(db, 'posts'),
    where('groupId', '==', groupId),
    where('published', '==', true),
    orderBy('createdAt', 'desc')
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => toPost(d.id, d.data()))
}

export async function getLatestPosts(limitCount = 30): Promise<Post[]> {
  const q = query(
    collection(db, 'posts'),
    where('published', '==', true),
    orderBy('createdAt', 'desc')
  )
  const snap = await getDocs(q)
  return snap.docs.slice(0, limitCount).map((d) => toPost(d.id, d.data()))
}

export async function getAllPosts(): Promise<Post[]> {
  const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map((d) => toPost(d.id, d.data()))
}

export function subscribeToLatestPosts(callback: (posts: Post[]) => void) {
  const q: Query<DocumentData> = query(
    collection(db, 'posts'),
    where('published', '==', true),
    orderBy('createdAt', 'desc')
  )
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => toPost(d.id, d.data())))
  })
}

export function subscribeToGroupPosts(groupId: string, callback: (posts: Post[]) => void) {
  const q: Query<DocumentData> = query(
    collection(db, 'posts'),
    where('groupId', '==', groupId),
    where('published', '==', true),
    orderBy('createdAt', 'desc')
  )
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => toPost(d.id, d.data())))
  })
}
