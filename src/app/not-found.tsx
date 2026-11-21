import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";

export const metadata = {
  title: "찾을 수 없음 (404)",
  robots: { index: false, follow: false },
};

export default function NotFoundPage() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <Container className="py-20 sm:py-28">
          <div className="mx-auto max-w-xl text-center">
            <p className="text-6xl font-extrabold text-brand-600 sm:text-7xl">404</p>
            <h1 className="mt-4 text-2xl font-extrabold text-brand-900 sm:text-3xl">찾으시는 화면이 없습니다.</h1>
            <p className="mt-3 text-slate-600">주소가 바뀌었거나 잘못 입력됐을 수 있어요.</p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/"
                className="inline-flex w-full items-center justify-center rounded-lg bg-brand-600 px-5 py-3 font-bold text-white hover:bg-brand-700 sm:w-auto"
              >
                홈으로
              </Link>
              <Link
                href="/#quote"
                className="inline-flex w-full items-center justify-center rounded-lg border border-slate-300 bg-white px-5 py-3 font-bold text-slate-800 hover:bg-slate-50 sm:w-auto"
              >
                30초 무료 견적 문의
              </Link>
            </div>
          </div>
        </Container>
      </main>
      <Footer />
    </>
  );
}
