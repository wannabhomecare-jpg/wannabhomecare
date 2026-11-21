import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/Reveal";

/**
 * 기준·공정 카드(기반 '네 가지 원칙' 카드 모양). Phase 2 의 카테고리 화면에서 쓴다.
 * 지금은 어디에도 연결하지 않는다.
 */
export type AboutCard = {
  /** 사진(없으면 '사진 준비 중' 자리표시) */
  src: string | null;
  alt: string;
  line1: string;
  line2: string;
};

export function AboutCards({
  kicker,
  title,
  lead,
  cards,
}: {
  kicker: string;
  title: React.ReactNode;
  lead?: string;
  cards: AboutCard[];
}) {
  return (
    <section className="scroll-mt-24 bg-white py-16 md:py-24">
      <Container>
        <Reveal variant="up" className="mx-auto max-w-3xl text-center">
          <p className="section-kicker">{kicker}</p>
          <h2 className="mt-4 text-3xl leading-tight font-black tracking-tight text-brand-900 sm:text-4xl lg:text-5xl">{title}</h2>
          {lead && <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">{lead}</p>}
        </Reveal>

        <RevealGroup stagger={0.1} className="mt-10 grid gap-4 sm:grid-cols-2 lg:mt-14 lg:grid-cols-4 lg:gap-5">
          {cards.map((card) => (
            <RevealItem key={card.line1} variant="up">
              <article className="group h-full overflow-hidden rounded-[1.4rem] border border-slate-200 bg-white shadow-[0_14px_45px_rgb(15_23_42/0.08)] transition duration-300 hover:-translate-y-1">
                <div className="relative aspect-[4/3] bg-brand-100 lg:aspect-[4/5]">
                  {card.src ? (
                    <Image
                      src={card.src}
                      alt={card.alt}
                      fill
                      sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm font-bold text-brand-800">사진 준비 중</div>
                  )}
                </div>
                <div className="border-t-2 border-brand-600 px-4 py-5 text-left">
                  <p className="text-base font-black text-brand-900 sm:text-lg">{card.line1}</p>
                  <p className="mt-1 text-sm font-bold text-brand-700 sm:text-base">{card.line2}</p>
                </div>
              </article>
            </RevealItem>
          ))}
        </RevealGroup>
      </Container>
    </section>
  );
}
