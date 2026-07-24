'use client'
import { useRef } from 'react'

interface Props { files: File[]; onChange: (files: File[]) => void; max?: number; label?: string }

// Up to `max` review photos: thumbnails with a delete button + an add tile.
// Compression happens at upload time (see lib/supabase/uploads).
export default function ReviewPhotoInput({ files, onChange, max = 3, label = 'Фото' }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  function add(list: FileList | null) {
    if (!list) return
    const incoming = Array.from(list).filter(
      f => /^image\/(jpe?g|png|webp)$/.test(f.type) && f.size <= 5 * 1024 * 1024,
    )
    onChange([...files, ...incoming].slice(0, max))
    if (inputRef.current) inputRef.current.value = ''
  }
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-brand-muted">{label} ({files.length}/{max})</label>
      <div className="flex flex-wrap gap-2">
        {files.map((f, i) => (
          <div key={i} className="relative h-16 w-16 overflow-hidden rounded-lg border border-brand-border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={URL.createObjectURL(f)} alt="" className="h-full w-full object-cover" />
            <button type="button" aria-label="Удалить" onClick={() => onChange(files.filter((_, j) => j !== i))}
              className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/55 text-xs leading-none text-white hover:bg-black/75">×</button>
          </div>
        ))}
        {files.length < max && (
          <button type="button" onClick={() => inputRef.current?.click()}
            className="flex h-16 w-16 items-center justify-center rounded-lg border border-dashed border-[#C9B7A6] text-2xl leading-none text-[#8A7A66] transition-colors hover:border-[#412618] hover:text-[#412618]">+</button>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={e => add(e.target.files)} />
    </div>
  )
}
