import "./globals.css";
import type { Metadata, Viewport } from "next";
import { baseMetadata } from "@/lib/seo/meta";
import { safeJsonLd, websiteJsonLd } from "@/lib/seo/jsonld";
import { PreviewBanner } from "@/components/landing/PreviewBanner";
import { BRAND_600 } from "@/lib/theme-tokens";

export const metadata: Metadata = baseMetadata;

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: BRAND_600,
  colorScheme: "light",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="flex min-h-full flex-col bg-white text-slate-900">
        <script
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: safeJsonLd(websiteJsonLd()) }}
        />
        <PreviewBanner />
        {children}
      </body>
    </html>
  );
}
