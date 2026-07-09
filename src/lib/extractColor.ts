'use client'

export const FALLBACK_COLOR = '#F0E9E0'

function luminance(r: number, g: number, b: number): number {
  return (r * 0.299 + g * 0.587 + b * 0.114) / 255
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  const l = (max + min) / 2
  const d = max - min
  let h = 0, s = 0
  if (d !== 0) {
    s = d / (1 - Math.abs(2 * l - 1))
    switch (max) {
      case r: h = ((g - b) / d) % 6; break
      case g: h = (b - r) / d + 2; break
      default: h = (r - g) / d + 4
    }
    h *= 60
    if (h < 0) h += 360
  }
  return [h, s, l]
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = l - c / 2
  let r = 0, g = 0, b = 0
  if (h < 60)       { r = c; g = x; b = 0 }
  else if (h < 120) { r = x; g = c; b = 0 }
  else if (h < 180) { r = 0; g = c; b = x }
  else if (h < 240) { r = 0; g = x; b = c }
  else if (h < 300) { r = x; g = 0; b = c }
  else              { r = c; g = 0; b = x }
  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)]
}

// Гарантирует, что итоговый цвет всегда светлый и мягкий (пастельная подложка под тёмный текст)
function softenColor(r: number, g: number, b: number): string {
  const lum = luminance(r, g, b)

  if (lum < 0.6) {
    // подмешиваем белый так, чтобы яркость поднялась до ~0.85
    const mix = (0.85 - lum) / (1 - lum)
    r = r + (255 - r) * mix
    g = g + (255 - g) * mix
    b = b + (255 - b) * mix
  }

  // приглушаем насыщенность и дожимаем светлоту до пастельного диапазона
  const [h, s, l] = rgbToHsl(r, g, b)
  const [nr, ng, nb] = hslToRgb(h, Math.min(s, 0.35), Math.max(l, 0.85))

  return `rgb(${nr}, ${ng}, ${nb})`
}

// Извлекает усреднённый цвет изображения через offscreen canvas и смягчает его под светлую подложку.
// При любой ошибке (в т.ч. CORS) возвращает FALLBACK_COLOR.
export function extractDominantColor(src: string): Promise<string> {
  return new Promise(resolve => {
    try {
      const img = new window.Image()
      img.crossOrigin = 'anonymous'

      img.onload = () => {
        try {
          const size = 50
          const canvas = document.createElement('canvas')
          canvas.width = size
          canvas.height = size
          const ctx = canvas.getContext('2d')
          if (!ctx) { resolve(FALLBACK_COLOR); return }

          ctx.drawImage(img, 0, 0, size, size)
          const { data } = ctx.getImageData(0, 0, size, size)

          let r = 0, g = 0, b = 0, count = 0
          for (let i = 0; i < data.length; i += 4) {
            if (data[i + 3] < 128) continue // skip transparent pixels
            r += data[i]
            g += data[i + 1]
            b += data[i + 2]
            count++
          }
          if (count === 0) { resolve(FALLBACK_COLOR); return }

          resolve(softenColor(r / count, g / count, b / count))
        } catch (err) {
          console.warn('extractDominantColor: canvas read failed (likely CORS)', err)
          resolve(FALLBACK_COLOR)
        }
      }

      img.onerror = err => {
        console.warn('extractDominantColor: image failed to load', err)
        resolve(FALLBACK_COLOR)
      }

      img.src = src
    } catch (err) {
      console.warn('extractDominantColor: unexpected error', err)
      resolve(FALLBACK_COLOR)
    }
  })
}
