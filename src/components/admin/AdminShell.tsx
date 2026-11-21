"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { Activity, FileText, LayoutDashboard, LogOut, Menu, Settings, X, Inbox } from "@/components/icons";

type NavItem = { href: string; label: string; group?: string; icon: ReactNode };

const NAV: NavItem[] = [
  { href: "/admin", label: "대시보드", icon: <LayoutDashboard size={17} /> },
  { href: "/admin/requests", label: "견적 신청", group: "고객 관리", icon: <Inbox size={17} /> },
  { href: "/admin/live-board", label: "실시간 현황판", group: "고객 관리", icon: <Activity size={17} /> },
  { href: "/admin/hero", label: "첫 화면(히어로)", group: "사이트 설정", icon: <Settings size={17} /> },
  { href: "/admin/content", label: "약속 · 서비스", group: "사이트 설정", icon: <FileText size={17} /> },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/admin") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "";
  const [mobileOpen, setMobileOpen] = useState(false);

  if (pathname === "/admin/login") return <>{children}</>;

  const navigation = (
    <nav className="px-3 pb-6">
      <ul className="space-y-1">
        {NAV.map((item, index) => {
          const previousGroup = index > 0 ? NAV[index - 1].group : undefined;
          const showGroup = item.group && item.group !== previousGroup;
          const active = isActive(pathname, item.href);
          return (
            <li key={item.href}>
              {showGroup && (
                <p className="mt-6 mb-2 px-3 text-[11px] font-bold tracking-[0.18em] text-brand-300">{item.group}</p>
              )}
              <Link
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${active ? "bg-brand-600 text-white" : "text-brand-100 hover:bg-white/10 hover:text-white"}`}
              >
                {item.icon}
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-40 flex items-center justify-between bg-brand-900 px-4 py-3 md:hidden">
        <Link href="/admin" className="flex items-center gap-2 font-extrabold text-white">
          <Image src="/logo/logo-horizontal-white.svg" alt="워너비홈케어" width={123} height={24} unoptimized />
          <span className="text-xs text-brand-200">관리자</span>
        </Link>
        <button
          type="button"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="관리자 메뉴"
          aria-expanded={mobileOpen}
          className="grid size-10 place-items-center rounded-xl border border-white/20 text-white"
        >
          {mobileOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </header>
      {mobileOpen && <div className="bg-brand-900 md:hidden">{navigation}</div>}
      <div className="md:flex">
        <aside className="hidden min-h-screen w-64 shrink-0 flex-col bg-brand-900 md:flex">
          <Link href="/admin" className="mx-6 mt-7 block">
            <Image src="/logo/logo-horizontal-white.svg" alt="워너비홈케어" width={164} height={32} unoptimized />
            <small className="mt-1 block text-xs text-brand-200">관리자</small>
          </Link>
          <div className="mt-6">{navigation}</div>
          <div className="mt-auto border-t border-white/10 p-5">
            <Link
              href="/admin/logout"
              className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-brand-100 transition hover:bg-white/10"
            >
              <LogOut size={16} />
              로그아웃
            </Link>
          </div>
        </aside>
        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-9">{children}</main>
      </div>
    </div>
  );
}
