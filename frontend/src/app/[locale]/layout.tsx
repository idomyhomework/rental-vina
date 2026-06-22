// --- LOCALE LAYOUT ---

import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { Fraunces, Inter } from "next/font/google";

import "../globals.css";

// --- Supported locales ---

const locales = ["ru", "es", "en", "uk"] as const;
type Locale = (typeof locales)[number];

// --- Fonts ---

// → display only — headlines; serif contrast against Inter body
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["opsz"],
  display: "swap",
});

// → body/UI — closest open-source substitute for Airbnb Cereal VF
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

// --- Metadata ---

export const metadata: Metadata = {
  title: "Аренда жилья в Винаросе",
  description:
    "Аренда квартир и продажа недвижимости в Винаросе и Пеньисколе (Коста-дель-Асаар, Испания).",
};

// --- Layout ---

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // → validate locale — 404 for unsupported values
  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html
      lang={locale}
      className={`${fraunces.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans bg-sand text-ink">
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
