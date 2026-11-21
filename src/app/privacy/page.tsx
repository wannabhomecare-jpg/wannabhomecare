import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";
import { BUSINESS } from "@/lib/business";

export const metadata: Metadata = {
  title: "개인정보처리방침",
  description: `${BUSINESS.name}의 개인정보 수집·이용 안내`,
  alternates: { canonical: "/privacy" },
};

/** 시행일. 내용을 바꾸면 함께 바꾼다. */
const EFFECTIVE_DATE = "2026-11-21";

export default function PrivacyPage() {
  const phone = BUSINESS.contact.phone;
  return (
    <>
      <Header />
      <main className="flex-1 pb-24">
        <Container className="max-w-3xl py-12 sm:py-16">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">개인정보처리방침</h1>
          <p className="mt-2 text-sm text-slate-600">시행일: {EFFECTIVE_DATE}</p>

          <div className="prose prose-slate prose-headings:font-extrabold prose-headings:text-slate-900 prose-a:text-brand-700 mt-8 max-w-none">
            <p>
              {BUSINESS.legalName}(이하 “회사”)는 견적 문의를 처리하는 데 필요한 개인정보만 받습니다.
              「개인정보 보호법」 등 관련 법령을 지킵니다.
            </p>

            <h2>1. 받는 개인정보</h2>
            <ul>
              <li>필수: 성함, 휴대폰 번호, 작업할 주소(시·도, 시·군·구, 나머지 주소), 원하시는 날짜, 공급 평수, 고르신 견적 항목</li>
              <li>선택: 특이사항·요청사항, 현장 사진(최대 3장)</li>
            </ul>

            <h2>2. 쓰는 곳</h2>
            <ul>
              <li>견적 안내와 상담</li>
              <li>작업 일정 조율과 진행 안내</li>
            </ul>

            <h2>3. 보관 기간</h2>
            <p>
              작업이 끝난 날부터 1년 동안 보관한 뒤 지웁니다. 법령에서 따로 정한 보관 기간이 있으면 그
              기간을 따릅니다.
            </p>

            <h2>4. 다른 곳에 주는 경우</h2>
            <p>회사는 개인정보를 다른 곳에 주지 않습니다. 법령에 따라 요구가 있을 때만 예외로 합니다.</p>

            <h2>5. 처리를 맡기는 곳</h2>
            <ul>
              <li>Supabase Inc.: 견적 요청과 사진 보관(데이터베이스·파일 저장)</li>
              <li>Vercel Inc.: 홈페이지 운영(서버)</li>
            </ul>

            <h2>6. 이용자의 권리</h2>
            <p>언제든지 본인 정보의 열람·정정·삭제와 처리 정지를 요청하실 수 있습니다. 아래 문의처로 연락해 주세요.</p>

            <h2>7. 안전하게 지키는 방법</h2>
            <ul>
              <li>모든 전송은 암호화(HTTPS)합니다.</li>
              <li>견적 요청은 관리자만 볼 수 있습니다. 공개 화면에는 가린 이름과 시·구만 보입니다.</li>
              <li>현장 사진은 비공개 저장소에 두고, 관리자 화면에서만 잠깐 열리는 주소로 봅니다.</li>
            </ul>

            <h2>8. 문의처</h2>
            <ul>
              <li>개인정보 보호 책임자: {BUSINESS.representative} (대표)</li>
              {phone && (
                <li>
                  전화: <a href={`tel:${phone.tel}`}>{phone.display}</a>
                </li>
              )}
            </ul>

            <p className="mt-8 text-xs text-slate-600">내용이 바뀌면 이 화면에 알립니다.</p>
          </div>
        </Container>
      </main>
      <Footer />
    </>
  );
}
