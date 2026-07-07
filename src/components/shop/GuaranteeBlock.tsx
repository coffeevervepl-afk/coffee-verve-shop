import { useTranslations } from 'next-intl'
import { ShieldCheck } from 'lucide-react'

interface Props { compact?: boolean }

export default function GuaranteeBlock({ compact }: Props) {
  const t = useTranslations('guarantee')

  if (compact) {
    return (
      <div className="flex items-center gap-3 rounded-[14px] bg-[#2C1A0E] px-5 py-4">
        <ShieldCheck size={22} className="flex-shrink-0 text-brand-gold" />
        <div>
          <p className="text-[16px] font-bold text-[#E8D5BC]">{t('compact_title')}</p>
          <p className="text-[14px] leading-snug text-[rgba(232,213,188,0.7)]">{t('compact')}</p>
        </div>
      </div>
    )
  }

  return (
    <section className="rounded-3xl border border-brand-border bg-brand-surface px-6 py-6">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-brand-gold/10">
          <ShieldCheck size={26} className="text-brand-gold" />
        </div>
        <div>
          <p className="font-semibold">{t('title')}</p>
          <p className="mt-1 text-sm leading-relaxed text-brand-muted">{t('body')}</p>
        </div>
      </div>
    </section>
  )
}
