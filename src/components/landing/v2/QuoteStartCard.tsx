import { QuoteLink } from "@/components/common/QuoteLink";
import { ArrowRight } from "@/components/icons";
import type { ServiceItem } from "@/lib/services";

/**
 * 실시간 목록 자리에 놓는 '견적 시작 카드'
 * (오픈 단계에서 보여 줄 실제 요청이 5건 미만이거나, 관리자가 목록을 껐을 때).
 */
export function QuoteStartCard({ services }: { services: ServiceItem[] }) {
  return (
    <div className="flex h-full flex-col justify-center bg-white px-5 py-8 sm:px-7">
      <p className="section-kicker">FREE QUOTE</p>
      <h2 className="mt-2 text-2xl font-black tracking-tight text-brand-900 sm:text-3xl">30초 무료 견적 문의</h2>
      <p className="mt-2 text-[15px] text-slate-600">필요한 서비스를 고르면 바로 시작합니다.</p>
      <ul className="mt-5 grid gap-2">
        {services.map((s) => (
          <li key={s.key}>
            <QuoteLink
              service={s.key}
              className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-base font-bold text-brand-900 transition hover:border-brand-600 hover:bg-brand-50"
            >
              <span>{s.name}</span>
              <ArrowRight aria-hidden className="size-5 text-brand-600" strokeWidth={2.25} />
            </QuoteLink>
          </li>
        ))}
      </ul>
    </div>
  );
}
