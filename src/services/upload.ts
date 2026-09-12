import { getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { storage } from './firebase'

const MAX_IMAGE_SIZE = 10 * 1024 * 1024

export async function uploadImage(file: File, userId: string): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Sadece resim dosyaları yüklenebilir.')
  }
  if (file.size > MAX_IMAGE_SIZE) {
    throw new Error('Resim boyutu en fazla 10 MB olabilir.')
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const path = `media/${userId}/${Date.now()}-${safeName}`
  const fileRef = ref(storage, path)
  await uploadBytes(fileRef, file, { contentType: file.type })
  return getDownloadURL(fileRef)
}
