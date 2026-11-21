import { Container } from "@/components/ui/Container";
import { MapPin, ShieldCheck } from "@/components/icons";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/Reveal";
import { getPromiseSection } from "@/lib/site-content";
import type { PromiseCardData } from "@/types/database";

function Lines({ text }: { text: string }) {
  return (
    <>
      {text.split("\n").map((line, i) => (
        <span key={i}>
          {i > 0 && <br />}
          {line}
        </span>
      ))}
    </>
  );
}

function Visual({ card, mobile }: { card: PromiseCardData; mobile?: boolean }) {
  if (card.visualText) {
    const num = card.visualText.replace("%", "");
    const hasPct = card.visualText.includes("%");
    return (
      <span className="flex items-baseline text-white">
        <span className={`${mobile ? "text-[2rem]" : "text-6xl sm:text-7xl"} leading-none font-black`}>{num}</span>
        {hasPct && <span className={`${mobile ? "text-base" : "text-2xl"} ml-0.5 font-extrabold`}>%</span>}
      </span>
    );
  }
  const Icon = card.icon === "map" ? MapPin : card.icon === "shield" ? ShieldCheck : null;
  if (!Icon) return null;
  return <Icon aria-hidden className={`${mobile ? "size-9" : "size-12 sm:size-14"} text-brand-300`} strokeWidth={1.6} />;
}

/** 약속 3칸(OUR PROMISE). 기반의 큰 숫자 '0원' 자리에 '100%'가 온다. */
export async function MasterSection() {
  const data = await getPromiseSection();

  return (
    <section
      id="promise"
      aria-labelledby="promise-title"
      className="brand-grid relative scroll-mt-24 overflow-hidden bg-brand-900 py-14 text-white md:py-24"
    >
      <Container>
        <Reveal variant="up" className="relative max-w-3xl sm:mx-auto sm:text-center">
          <p className="section-kicker section-kicker-dark">{data.kicker}</p>
          <h2 id="promise-title" className="mt-3 text-[1.6rem] leading-snug font-black tracking-tight text-white sm:mt-4 sm:text-4xl lg:text-[2.75rem]">
            <Lines text={data.title} />
          </h2>
        </Reveal>

        <RevealGroup stagger={0.1} className="relative mt-8 grid gap-3 sm:mt-12 md:grid-cols-3 md:gap-5">
          {data.cards.map((card) => (
            <RevealItem key={card.key} variant="up">
              {/* 휴대폰: 가로 카드 */}
              <article className="flex items-center gap-4 rounded-2xl border border-white/15 bg-white/[0.06] px-4 py-4 md:hidden">
                <div className="flex w-16 shrink-0 justify-center">
                  <Visual card={card} mobile />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">{card.title}</h3>
                  <p className="mt-1 text-[15px] leading-relaxed text-brand-100">{card.bodyMobile ?? card.body.replace(/\n/g, " ")}</p>
                </div>
              </article>
              {/* PC: 세로 카드 */}
              <article className="hidden h-full flex-col items-center rounded-[1.4rem] border border-white/15 bg-white/[0.06] px-6 py-10 text-center shadow-2xl shadow-black/10 backdrop-blur-sm transition hover:border-brand-300/40 hover:bg-white/[0.09] md:flex">
                <div className="flex h-20 items-center justify-center sm:h-24">
                  <Visual card={card} />
                </div>
                <p className="mt-4 text-[15px] leading-7 text-brand-100">
                  <Lines text={card.body} />
                </p>
                <span aria-hidden className="mt-5 h-0.5 w-10 rounded-full bg-brand-500" />
                <h3 className="mt-5 text-xl font-black text-white">{card.title}</h3>
              </article>
            </RevealItem>
          ))}
        </RevealGroup>
      </Container>
    </section>
  );
}
