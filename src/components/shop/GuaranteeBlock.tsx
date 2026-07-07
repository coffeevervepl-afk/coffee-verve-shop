import { useTranslations } from 'next-intl'
import { ShieldCheck } from 'lucide-react'

interface Props { compact?: boolean }

export default function GuaranteeBlock({ compact }: Props) {
  const t = useTranslations('guarantee')

  if (compact) {
    return (
      <div className="w-full rounded-[12px] bg-[#2C1810] px-5 py-4">
        <p className="text-[17px] font-bold text-white">{t('compact_title')}</p>
        <p className="text-[17px] text-[rgba(255,255,255,0.8)]">{t('compact')}</p>
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
