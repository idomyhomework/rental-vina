// ═══════════════════════════════════════════════════════════════════════════
//  ROOT LAYOUT
// ═══════════════════════════════════════════════════════════════════════════

import type { Metadata } from "next";
import { Fraunces, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

// ── Fonts ──────────────────────────────────────────────────────────────────

// → display only — headlines; variable weight keeps bundle small
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["opsz", "wght"],
  display: "swap",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

// ── Metadata ───────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: "Alquileres Vinaròs",
  description: "Vacation rentals and property sales in Vinaròs & Peñíscola (Costa del Azahar).",
};

// ── Layout ─────────────────────────────────────────────────────────────────

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ru"
      className={`${fraunces.variable} ${plusJakartaSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans bg-sand text-ink">
        {children}
      </body>
    </html>
  );
}
