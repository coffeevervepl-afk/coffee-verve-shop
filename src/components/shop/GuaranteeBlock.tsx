import { useTranslations } from 'next-intl'
import { ShieldCheck } from 'lucide-react'

interface Props { compact?: boolean }

export default function GuaranteeBlock({ compact }: Props) {
  const t = useTranslations('guarantee')

  if (compact) {
    return (
      <div className="group relative w-full rounded-[12px] bg-[#2C1810] px-5 py-4 transition-all duration-200 cursor-default hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(44,24,16,0.35)] hover:bg-[#2C1810]">
        <p className="text-[17px] font-bold text-white">{t('compact_title')}</p>
        <p className="text-[18px] text-[rgba(255,255,255,0.8)]">{t('compact')}</p>

        {/* Tooltip — desktop only */}
        <div className="absolute bottom-full left-0 z-50 mb-2 hidden w-full translate-y-1 rounded-[14px] border border-[rgba(255,255,255,0.9)] bg-[rgba(255,255,255,0.85)] px-5 py-4 text-[#2C1810] opacity-0 shadow-[0_8px_32px_rgba(44,24,16,0.15)] backdrop-blur-[16px] transition-all duration-200 ease-out group-hover:translate-y-0 group-hover:opacity-100 md:block">
          <p className="mb-2 text-[15px] font-bold text-[#2C1810]">{t('tooltip_title')}</p>
          <p className="text-sm text-[#2C1810]">{t('tooltip_text')}</p>
          <p className="mt-1 text-sm text-[#6B4226]">{t('tooltip_line1')}</p>
          <p className="text-sm text-[#6B4226]">{t('tooltip_line2')}</p>
          <div className="absolute left-6 top-full h-0 w-0 border-x-8 border-t-8 border-x-transparent border-t-[rgba(255,255,255,0.85)]" />
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
