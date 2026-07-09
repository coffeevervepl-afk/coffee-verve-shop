import { useTranslations } from 'next-intl'
import { ShieldCheck } from 'lucide-react'

interface Props { compact?: boolean }

export default function GuaranteeBlock({ compact }: Props) {
  const t = useTranslations('guarantee')

  if (compact) {
    return (
      <div className="group relative w-full rounded-[12px] bg-[#3A2115] px-4 py-2.5 transition-all duration-200 cursor-default hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(44,24,16,0.35)] hover:bg-[#3A2115]">
        <p className="text-[14px] font-bold text-white">{t('compact_title')}</p>
        <p className="text-[13px] text-[rgba(255,255,255,0.8)]">{t('compact')}</p>

        {/* Tooltip — desktop only */}
        <div className="absolute bottom-full left-0 z-50 mb-2 hidden w-full translate-y-1 rounded-[20px] border border-[rgba(255,255,255,0.55)] bg-[rgba(255,255,255,0.18)] px-5 py-4 text-[#1C1008] opacity-0 shadow-[0_8px_32px_rgba(44,24,16,0.10),0_2px_8px_rgba(44,24,16,0.06),inset_0_1px_0_rgba(255,255,255,0.9),inset_0_-1px_0_rgba(255,255,255,0.2)] [-webkit-backdrop-filter:blur(24px)_saturate(2)_brightness(1.1)] [backdrop-filter:blur(24px)_saturate(2)_brightness(1.1)] transition-all duration-200 ease-out group-hover:translate-y-0 group-hover:opacity-100 md:block">
          <p className="mb-2 text-[15px] font-bold text-[#1C1008]">{t('tooltip_title')}</p>
          <p className="text-sm text-[#1C1008]">{t('tooltip_text')}</p>
          <p className="mt-1 text-sm font-semibold text-[#6B4226]">{t('tooltip_line1')}</p>
          <p className="text-sm font-semibold text-[#6B4226]">{t('tooltip_line2')}</p>
          <div className="absolute left-6 top-full h-3 w-3 -translate-y-1/2 rotate-45 border border-[rgba(255,255,255,0.55)] bg-[rgba(255,255,255,0.18)]" />
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
