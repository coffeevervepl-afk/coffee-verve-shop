export interface FlavorColor {
  bg: string      // фон тега при наведении
  text: string    // цвет текста при наведении
}

// Каждая категория содержит ключевые слова на 3 языках
const FLAVOR_MAP: { keywords: string[]; color: FlavorColor }[] = [
  {
    keywords: ['шоколад', 'czekolada', 'шоколад', 'chocolate', 'cacao', 'какао', 'kakao'],
    color: { bg: '#3D1F00', text: '#D62828' }
  },
  {
    keywords: ['карамель', 'karmel', 'caramel', 'ирис', 'toffee'],
    color: { bg: '#2A1500', text: '#F77F00' }
  },
  {
    keywords: ['орех', 'orzech', 'горіх', 'фундук', 'миндаль', 'nut', 'hazelnut', 'almond', 'nuga', 'нуга'],
    color: { bg: '#2A1F00', text: '#C8960C' }
  },
  {
    keywords: ['ягод', 'jagod', 'berry', 'смородин', 'porzeczk', 'черник', 'малин', 'клубник', 'вишн', 'wiśni', 'слив', 'śliwk'],
    color: { bg: '#1F001A', text: '#F01B5B' }
  },
  {
    keywords: ['цитрус', 'cytrus', 'citrus', 'мандарин', 'mandarynk', 'лимон', 'cytryn', 'апельсин', 'pomarańcz', 'грейпфрут', 'бергамот', 'bergamot'],
    color: { bg: '#1F1500', text: '#E89400' }
  },
  {
    keywords: ['фрукт', 'owoc', 'фрукт', 'fruit', 'яблок', 'jabłk', 'абрикос', 'morel', 'персик', 'brzoskwin'],
    color: { bg: '#001F10', text: '#0DAA4F' }
  },
  {
    keywords: ['цвет', 'kwiat', 'квіт', 'floral', 'жасмин', 'jaśmin', 'роза', 'róż'],
    color: { bg: '#1A0A1F', text: '#E01FCC' }
  },
  {
    keywords: ['специ', 'przypraw', 'спеці', 'spice', 'корица', 'cynamon', 'ваниль', 'wanilia', 'vanilla'],
    color: { bg: '#2A1000', text: '#F03E12' }
  },
  {
    keywords: ['мёд', 'miód', 'мед', 'honey', 'сироп', 'syrop', 'сахар', 'cukier'],
    color: { bg: '#2A2200', text: '#D9A400' }
  },
]

// Дефолтный цвет если вкус не распознан
const DEFAULT_COLOR: FlavorColor = { bg: '#2C1810', text: '#A0521C' }

export function getFlavorColor(note: string): FlavorColor {
  const lower = note.toLowerCase().trim()
  for (const entry of FLAVOR_MAP) {
    if (entry.keywords.some(kw => lower.includes(kw))) {
      return entry.color
    }
  }
  return DEFAULT_COLOR
}
