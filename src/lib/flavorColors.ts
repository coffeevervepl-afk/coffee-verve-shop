export interface FlavorColor {
  bg: string      // фон тега при наведении
  text: string    // цвет текста при наведении
}

// Каждая категория содержит ключевые слова на 3 языках
const FLAVOR_MAP: { keywords: string[]; color: FlavorColor }[] = [
  {
    keywords: ['шоколад', 'czekolada', 'шоколад', 'chocolate', 'cacao', 'какао', 'kakao'],
    color: { bg: '#3D1F00', text: '#B5651D' }
  },
  {
    keywords: ['карамель', 'karmel', 'caramel', 'ирис', 'toffee'],
    color: { bg: '#2A1500', text: '#E8890C' }
  },
  {
    keywords: ['орех', 'orzech', 'горіх', 'фундук', 'миндаль', 'nut', 'hazelnut', 'almond', 'nuga', 'нуга'],
    color: { bg: '#2A1F00', text: '#C89632' }
  },
  {
    keywords: ['ягод', 'jagod', 'berry', 'смородин', 'porzeczk', 'черник', 'малин', 'клубник', 'вишн', 'wiśni', 'слив', 'śliwk'],
    color: { bg: '#1F001A', text: '#D6336C' }
  },
  {
    keywords: ['цитрус', 'cytrus', 'citrus', 'мандарин', 'mandarynk', 'лимон', 'cytryn', 'апельсин', 'pomarańcz', 'грейпфрут', 'бергамот', 'bergamot'],
    color: { bg: '#1F1500', text: '#E8A00C' }
  },
  {
    keywords: ['фрукт', 'owoc', 'фрукт', 'fruit', 'яблок', 'jabłk', 'абрикос', 'morel', 'персик', 'brzoskwin'],
    color: { bg: '#001F10', text: '#2FA860' }
  },
  {
    keywords: ['цвет', 'kwiat', 'квіт', 'floral', 'жасмин', 'jaśmin', 'роза', 'róż'],
    color: { bg: '#1A0A1F', text: '#C44DD6' }
  },
  {
    keywords: ['специ', 'przypraw', 'спеці', 'spice', 'корица', 'cynamon', 'ваниль', 'wanilia', 'vanilla'],
    color: { bg: '#2A1000', text: '#E85D2B' }
  },
  {
    keywords: ['мёд', 'miód', 'мед', 'honey', 'сироп', 'syrop', 'сахар', 'cukier'],
    color: { bg: '#2A2200', text: '#E0B00C' }
  },
]

// Дефолтный цвет если вкус не распознан
const DEFAULT_COLOR: FlavorColor = { bg: '#2C1810', text: '#8B5A2B' }

export function getFlavorColor(note: string): FlavorColor {
  const lower = note.toLowerCase().trim()
  for (const entry of FLAVOR_MAP) {
    if (entry.keywords.some(kw => lower.includes(kw))) {
      return entry.color
    }
  }
  return DEFAULT_COLOR
}
