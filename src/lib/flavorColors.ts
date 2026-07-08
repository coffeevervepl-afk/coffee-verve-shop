export interface FlavorColor {
  bg: string      // фон тега при наведении
  text: string    // цвет текста при наведении
}

// Каждая категория содержит ключевые слова на 3 языках
const FLAVOR_MAP: { keywords: string[]; color: FlavorColor }[] = [
  {
    keywords: ['шоколад', 'czekolada', 'шоколад', 'chocolate', 'cacao', 'какао', 'kakao'],
    color: { bg: '#3D1F00', text: '#D4956B' }
  },
  {
    keywords: ['карамель', 'karmel', 'caramel', 'ирис', 'toffee'],
    color: { bg: '#2A1500', text: '#D4820B' }
  },
  {
    keywords: ['орех', 'orzech', 'горіх', 'фундук', 'миндаль', 'nut', 'hazelnut', 'almond', 'nuga', 'нуга'],
    color: { bg: '#2A1F00', text: '#C4A040' }
  },
  {
    keywords: ['ягод', 'jagod', 'berry', 'смородин', 'porzeczk', 'черник', 'малин', 'клубник', 'вишн', 'wiśni', 'слив', 'śliwk'],
    color: { bg: '#1F001A', text: '#C44BA0' }
  },
  {
    keywords: ['цитрус', 'cytrus', 'citrus', 'мандарин', 'mandarynk', 'лимон', 'cytryn', 'апельсин', 'pomarańcz', 'грейпфрут', 'бергамот', 'bergamot'],
    color: { bg: '#1F1500', text: '#C49A0B' }
  },
  {
    keywords: ['фрукт', 'owoc', 'фрукт', 'fruit', 'яблок', 'jabłk', 'абрикос', 'morel', 'персик', 'brzoskwin'],
    color: { bg: '#001F10', text: '#4CAF77' }
  },
  {
    keywords: ['цвет', 'kwiat', 'квіт', 'floral', 'жасмин', 'jaśmin', 'роза', 'róż'],
    color: { bg: '#1A0A1F', text: '#B57BC4' }
  },
  {
    keywords: ['специ', 'przypraw', 'спеці', 'spice', 'корица', 'cynamon', 'ваниль', 'wanilia', 'vanilla'],
    color: { bg: '#2A1000', text: '#D46B2B' }
  },
  {
    keywords: ['мёд', 'miód', 'мед', 'honey', 'сироп', 'syrop', 'сахар', 'cukier'],
    color: { bg: '#2A2200', text: '#D4B00B' }
  },
]

// Дефолтный цвет если вкус не распознан
const DEFAULT_COLOR: FlavorColor = { bg: '#2C1810', text: '#C4A88F' }

export function getFlavorColor(note: string): FlavorColor {
  const lower = note.toLowerCase().trim()
  for (const entry of FLAVOR_MAP) {
    if (entry.keywords.some(kw => lower.includes(kw))) {
      return entry.color
    }
  }
  return DEFAULT_COLOR
}
