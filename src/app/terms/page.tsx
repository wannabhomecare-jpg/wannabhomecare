import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";
import { BUSINESS } from "@/lib/business";

export const metadata: Metadata = {
  title: "이용약관",
  description: `${BUSINESS.name} 홈페이지 이용약관`,
  alternates: { canonical: "/terms" },
};

const EFFECTIVE_DATE = "2026-11-21";

export default function TermsPage() {
  return (
    <>
      <Header />
      <main className="flex-1 pb-24">
        <Container className="max-w-3xl py-12 sm:py-16">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">이용약관</h1>
          <p className="mt-2 text-sm text-slate-600">시행일: {EFFECTIVE_DATE}</p>

          <div className="prose prose-slate prose-headings:font-extrabold prose-headings:text-slate-900 prose-a:text-brand-700 mt-8 max-w-none">
            <h2>제1조 (목적)</h2>
            <p>
              이 약관은 {BUSINESS.legalName}(이하 “회사”)가 운영하는 홈페이지(이하 “서비스”)의 이용 조건을
              정합니다.
            </p>

            <h2>제2조 (정의)</h2>
            <ul>
              <li>“이용자”는 서비스에서 정보를 보거나 견적을 문의하는 분입니다.</li>
              <li>“견적 문의”는 홈페이지의 30초 무료 견적 문의로 상담을 요청하는 것입니다.</li>
            </ul>

            <h2>제3조 (견적 문의)</h2>
            <ol>
              <li>견적 문의를 받으면 내용을 확인한 뒤 상담사가 연락드립니다.</li>
              <li>정확한 금액과 일정은 상담에서 함께 정합니다.</li>
            </ol>

            <h2>제4조 (책임의 한계)</h2>
            <p>천재지변, 통신 장애처럼 회사가 막을 수 없는 일로 서비스가 멈추면 회사는 책임을 지지 않습니다.</p>

            <h2>제5조 (개인정보 보호)</h2>
            <p>
              개인정보는 <a href="/privacy">개인정보처리방침</a>에 따라 다룹니다.
            </p>

            <h2>제6조 (분쟁 해결)</h2>
            <p>이 약관과 관련된 분쟁은 대한민국 법령을 따릅니다.</p>

            <p className="mt-8 text-xs text-slate-600">약관이 바뀌면 이 화면에 알립니다.</p>
          </div>
        </Container>
      </main>
      <Footer />
    </>
  );
}
