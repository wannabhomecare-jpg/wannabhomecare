import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { ArrowRight } from "@/components/icons";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/Reveal";
import { QuoteLink } from "@/components/common/QuoteLink";
import { getServices } from "@/lib/site-content";
import type { ServiceItem } from "@/lib/services";

function Photo({ s, sizes }: { s: ServiceItem; sizes: string }) {
  if (!s.image) {
    return (
      <div className="flex h-full items-center justify-center bg-brand-100 px-2 text-center text-xs font-bold text-brand-800 sm:text-base">
        사진 준비 중
      </div>
    );
  }
  return (
    <Image
      src={s.image}
      alt={s.alt}
      fill
      sizes={sizes}
      style={{ objectPosition: s.focus }}
      className="object-cover transition-transform duration-500 group-hover:scale-105"
    />
  );
}

/**
 * 서비스 6칸 — 한 묶음. PC 3칸 2줄(사진 + 이름 + 한 줄 + 링크 글자), 휴대폰 3칸 2줄(작은 사진 + 이름).
 * 카테고리 화면은 Phase 2 에서 만든다. 지금은 카드를 누르면 그 서비스가 선택된 견적으로 간다.
 */
export async function ServicesList() {
  const services = await getServices();

  return (
    <section id="services" aria-labelledby="services-title" className="scroll-mt-24 bg-white py-14 md:py-24">
      <Container>
        <Reveal variant="up" className="max-w-2xl sm:mx-auto sm:text-center">
          <p className="section-kicker">SERVICE</p>
          <h2 id="services-title" className="mt-3 text-[1.6rem] font-black tracking-tight text-brand-900 sm:mt-4 sm:text-4xl lg:text-[2.75rem]">
            청소부터 시공까지, <span className="text-brand-600">한 곳에서</span>
          </h2>
          <p className="mt-3 text-[15px] leading-7 text-slate-600 sm:mt-4 sm:text-lg">
            필요한 서비스를 누르면 바로 견적 문의로 이어집니다.
          </p>
        </Reveal>

        <RevealGroup stagger={0.06} className="mt-7 grid grid-cols-3 gap-2.5 sm:mt-12 sm:gap-5">
          {services.map((s) => (
            <RevealItem key={s.key} variant="up">
              <QuoteLink
                service={s.key}
                ariaLabel={`${s.name} 견적 문의하기`}
                className="group block h-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_10px_35px_rgb(15_23_42/0.07)] transition-all duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-[0_20px_45px_rgb(15_23_42/0.13)] sm:rounded-[1.35rem]"
              >
                <div className="relative aspect-[16/10] overflow-hidden bg-brand-100">
                  <Photo s={s} sizes="(min-width: 1024px) 400px, 33vw" />
                </div>
                <div className="border-t-2 border-brand-600 px-2 py-2.5 text-center sm:p-6 sm:text-left">
                  <h3 className="text-[15px] font-black text-brand-900 sm:text-xl">{s.name}</h3>
                  <p className="mt-2 hidden min-h-6 text-[15px] leading-6 text-slate-600 sm:block">{s.summary}</p>
                  <span className="mt-3 hidden items-center gap-1 text-[15px] font-bold text-brand-700 group-hover:underline sm:inline-flex">
                    견적 문의하기
                    <ArrowRight aria-hidden className="size-4" strokeWidth={2.25} />
                  </span>
                </div>
              </QuoteLink>
            </RevealItem>
          ))}
        </RevealGroup>
      </Container>
    </section>
  );
}
