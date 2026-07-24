'use client'
import { createClient } from '@/lib/supabase/client'
import { compressImage, compressAvatar } from '@/lib/imageCompress'

// Uploads go to `<bucket>/<auth-uid>/…` — matches the storage RLS (own folder only).
async function authUid(): Promise<string> {
  const sb = createClient()
  const { data } = await sb.auth.getUser()
  if (!data.user?.id) throw new Error('not-authenticated')
  return data.user.id
}

export async function uploadAvatar(file: File): Promise<string> {
  const sb = createClient()
  const uid = await authUid()
  const blob = await compressAvatar(file, 400)
  const path = `${uid}/avatar-${Date.now()}.jpg`
  const { error } = await sb.storage.from('avatars').upload(path, blob, { contentType: 'image/jpeg', upsert: true })
  if (error) throw error
  return sb.storage.from('avatars').getPublicUrl(path).data.publicUrl
}

export async function uploadReviewPhotos(files: File[]): Promise<string[]> {
  const sb = createClient()
  const uid = await authUid()
  const urls: string[] = []
  for (const f of files.slice(0, 3)) {
    const blob = await compressImage(f, 1280, 0.82)
    const path = `${uid}/review-${Date.now()}-${urls.length}.jpg`
    const { error } = await sb.storage.from('review-photos').upload(path, blob, { contentType: 'image/jpeg' })
    if (error) throw error
    urls.push(sb.storage.from('review-photos').getPublicUrl(path).data.publicUrl)
  }
  return urls
}
