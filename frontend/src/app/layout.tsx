// --- ROOT LAYOUT (thin wrapper) ---

// → locale-specific rendering lives in [locale]/layout.tsx
// → this file exists only because Next.js requires a root layout

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
