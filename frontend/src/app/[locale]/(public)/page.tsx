// --- HOME PAGE (Server Component, SEO-critical) ---

import { useTranslations } from "next-intl";

export default function HomePage() {
  const t = useTranslations("common");

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-16">
      <h1 className="font-display text-4xl font-semibold text-ink md:text-5xl">
        {t("siteName")}
      </h1>
    </main>
  );
}
