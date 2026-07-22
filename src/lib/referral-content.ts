import type { Locale } from '@/types/shop'

interface FAQ { q: string; a: string }
interface Step { icon: string; title: string; text: string }
export interface RefContent {
  metaTitle:       string
  metaDescription: string
  heroTitle:       string
  heroSubtitle:    string
  steps:           Step[]
  faqTitle:        string
  faq:             FAQ[]
  ctaLogin:        string
  loggedTitle:     string
}

export const REFERRAL_CONTENT: Record<Locale, RefContent> = {
  pl: {
    metaTitle:       'Program poleceń — Coffee Verve | Kawa w prezencie',
    metaDescription: 'Poleć Coffee Verve znajomym: oni dostają paczkę kawy 250g gratis przy pierwszym zamówieniu, a Ty — paczkę za każdego znajomego. Sprawdź, jak to działa.',
    heroTitle:       'Poleć nas znajomym — otrzymajcie kawę w prezencie',
    heroSubtitle:    'Podziel się swoim kodem. Znajomy dostaje paczkę 250g gratis przy pierwszym zamówieniu, a Ty — paczkę za każdego, kto zamówi.',
    steps: [
      { icon: '📤', title: 'Udostępnij kod', text: 'Skopiuj swój kod polecający i wyślij znajomym — przez WhatsApp, SMS albo osobiście.' },
      { icon: '🎁', title: 'Znajomy zamawia', text: 'Przy pierwszym zamówieniu (min. 60 zł) znajomy wpisuje kod i wybiera paczkę 250g gratis.' },
      { icon: '☕', title: 'Ty dostajesz kawę', text: 'Gdy jego zamówienie zostanie dostarczone, otrzymujesz paczkę 250g do wykorzystania przy kolejnym zamówieniu.' },
    ],
    faqTitle: 'Najczęstsze pytania',
    faq: [
      { q: 'Jak działa program „Paczka za paczkę”?', a: 'Dzielisz się swoim kodem polecającym. Znajomy używa go przy pierwszym zamówieniu i dostaje paczkę 250g gratis, a Ty otrzymujesz własną paczkę-prezent, gdy jego zamówienie zostanie dostarczone.' },
      { q: 'Skąd wezmę swój kod?', a: 'Twój unikalny kod znajdziesz w panelu klienta w sekcji „Poleć znajomym”. Możesz go skopiować lub udostępnić jednym kliknięciem.' },
      { q: 'Co dostaje mój znajomy?', a: 'Paczkę kawy specialty 250g gratis przy pierwszym zamówieniu — dowolny sort z naszego menu.' },
      { q: 'Co dostaję ja?', a: 'Za każdego znajomego, którego zamówienie zostanie dostarczone, dostajesz paczkę 250g gratis do wykorzystania przy swoim kolejnym zamówieniu.' },
      { q: 'Czy jest minimalna kwota zamówienia?', a: 'Tak — zamówienie znajomego musi wynosić co najmniej 60 zł, aby kod się liczył.' },
      { q: 'Kiedy dostanę swój bonus?', a: 'Bonus staje się dostępny, gdy zamówienie znajomego zmieni status na „Dostarczone”.' },
      { q: 'Jak długo ważny jest bonus?', a: 'Każdy bonus jest ważny 90 dni od momentu przyznania. Potem wygasa.' },
      { q: 'Ilu znajomych mogę zaprosić?', a: 'Bez limitu, ale możesz otrzymać maksymalnie 5 bonusów miesięcznie.' },
      { q: 'Czy mogę użyć własnego kodu?', a: 'Nie — kodu nie można zastosować do własnego zamówienia.' },
      { q: 'Czy bonus łączy się z rabatem lojalnościowym?', a: 'Tak. Bonusowa paczka jest niezależna od Twojego rabatu poziomu i kodów promocyjnych.' },
      { q: 'Jak wykorzystać zebrany bonus?', a: 'Przy składaniu zamówienia zaznacz opcję dodania bonusowej paczki i wybierz sort — dodamy ją za darmo.' },
      { q: 'Gdzie zobaczę zaproszonych znajomych i bonusy?', a: 'W panelu klienta, w sekcji „Poleć znajomym”, widzisz liczbę zaproszonych osób i dostępnych bonusów.' },
    ],
    ctaLogin:    'Zaloguj się i zaproś znajomych',
    loggedTitle: 'Twój kod polecający',
  },
  ru: {
    metaTitle:       'Реферальная программа — Coffee Verve | Кофе в подарок',
    metaDescription: 'Приведите друга в Coffee Verve: он получает пачку кофе 250г бесплатно за первый заказ, а вы — пачку за каждого друга. Узнайте, как это работает.',
    heroTitle:       'Приведи друга — получите кофе в подарок',
    heroSubtitle:    'Поделитесь своим кодом. Друг получает пачку 250г бесплатно за первый заказ, а вы — пачку за каждого, кто закажет.',
    steps: [
      { icon: '📤', title: 'Поделитесь кодом', text: 'Скопируйте свой реферальный код и отправьте друзьям — через WhatsApp, SMS или лично.' },
      { icon: '🎁', title: 'Друг заказывает', text: 'При первом заказе (от 60 zł) друг вводит код и выбирает пачку 250г в подарок.' },
      { icon: '☕', title: 'Вы получаете кофе', text: 'Когда его заказ доставлен, вы получаете пачку 250г для следующего заказа.' },
    ],
    faqTitle: 'Частые вопросы',
    faq: [
      { q: 'Как работает программа «Пачка за пачку»?', a: 'Вы делитесь своим реферальным кодом. Друг использует его при первом заказе и получает пачку 250г бесплатно, а вы получаете свою пачку-подарок, когда его заказ доставлен.' },
      { q: 'Где взять свой код?', a: 'Ваш уникальный код есть в личном кабинете в разделе «Приведи друга». Его можно скопировать или отправить одним кликом.' },
      { q: 'Что получает друг?', a: 'Пачку кофе specialty 250г бесплатно за первый заказ — любой сорт из нашего меню.' },
      { q: 'Что получаю я?', a: 'За каждого друга, чей заказ доставлен, вы получаете пачку 250г бесплатно для своего следующего заказа.' },
      { q: 'Есть ли минимальная сумма заказа?', a: 'Да — заказ друга должен быть не меньше 60 zł, чтобы код засчитался.' },
      { q: 'Когда я получу бонус?', a: 'Бонус становится доступным, когда заказ друга получает статус «Доставлен».' },
      { q: 'Сколько действует бонус?', a: 'Каждый бонус действует 90 дней с момента начисления. Потом сгорает.' },
      { q: 'Сколько друзей можно пригласить?', a: 'Без лимита, но получить можно не более 5 бонусов в месяц.' },
      { q: 'Можно ли применить свой код?', a: 'Нет — код нельзя использовать для собственного заказа.' },
      { q: 'Бонус суммируется со скидкой лояльности?', a: 'Да. Бонусная пачка не зависит от вашей скидки уровня и промокодов.' },
      { q: 'Как использовать накопленный бонус?', a: 'При оформлении заказа отметьте опцию добавить бонусную пачку и выберите сорт — мы добавим её бесплатно.' },
      { q: 'Где увидеть приглашённых друзей и бонусы?', a: 'В личном кабинете, в разделе «Приведи друга», видно число приглашённых и доступных бонусов.' },
    ],
    ctaLogin:    'Войдите и пригласите друзей',
    loggedTitle: 'Ваш реферальный код',
  },
  ua: {
    metaTitle:       'Реферальна програма — Coffee Verve | Кава в подарунок',
    metaDescription: 'Приведіть друга в Coffee Verve: він отримує пачку кави 250г безкоштовно за перше замовлення, а ви — пачку за кожного друга. Дізнайтесь, як це працює.',
    heroTitle:       'Приведи друга — отримайте каву в подарунок',
    heroSubtitle:    'Поділіться своїм кодом. Друг отримує пачку 250г безкоштовно за перше замовлення, а ви — пачку за кожного, хто замовить.',
    steps: [
      { icon: '📤', title: 'Поділіться кодом', text: 'Скопіюйте свій реферальний код і надішліть друзям — через WhatsApp, SMS або особисто.' },
      { icon: '🎁', title: 'Друг замовляє', text: 'При першому замовленні (від 60 zł) друг вводить код і обирає пачку 250г у подарунок.' },
      { icon: '☕', title: 'Ви отримуєте каву', text: 'Коли його замовлення доставлено, ви отримуєте пачку 250г для наступного замовлення.' },
    ],
    faqTitle: 'Часті запитання',
    faq: [
      { q: 'Як працює програма «Пачка за пачку»?', a: 'Ви ділитесь своїм реферальним кодом. Друг використовує його при першому замовленні й отримує пачку 250г безкоштовно, а ви отримуєте свою пачку-подарунок, коли його замовлення доставлено.' },
      { q: 'Де взяти свій код?', a: 'Ваш унікальний код є в особистому кабінеті в розділі «Приведи друга». Його можна скопіювати або надіслати одним кліком.' },
      { q: 'Що отримує друг?', a: 'Пачку кави specialty 250г безкоштовно за перше замовлення — будь-який сорт із нашого меню.' },
      { q: 'Що отримую я?', a: 'За кожного друга, чиє замовлення доставлено, ви отримуєте пачку 250г безкоштовно для свого наступного замовлення.' },
      { q: 'Чи є мінімальна сума замовлення?', a: 'Так — замовлення друга має бути не менше 60 zł, щоб код зарахувався.' },
      { q: 'Коли я отримаю бонус?', a: 'Бонус стає доступним, коли замовлення друга набуває статусу «Доставлено».' },
      { q: 'Скільки діє бонус?', a: 'Кожен бонус діє 90 днів із моменту нарахування. Потім згорає.' },
      { q: 'Скільки друзів можна запросити?', a: 'Без ліміту, але отримати можна не більше 5 бонусів на місяць.' },
      { q: 'Чи можна застосувати свій код?', a: 'Ні — код не можна використати для власного замовлення.' },
      { q: 'Чи сумується бонус зі знижкою лояльності?', a: 'Так. Бонусна пачка не залежить від вашої знижки рівня та промокодів.' },
      { q: 'Як використати накопичений бонус?', a: 'Під час оформлення замовлення позначте опцію додати бонусну пачку та оберіть сорт — ми додамо її безкоштовно.' },
      { q: 'Де побачити запрошених друзів і бонуси?', a: 'В особистому кабінеті, у розділі «Приведи друга», видно кількість запрошених і доступних бонусів.' },
    ],
    ctaLogin:    'Увійдіть і запросіть друзів',
    loggedTitle: 'Ваш реферальний код',
  },
}
