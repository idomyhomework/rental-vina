// --- ADMIN — LAYOUT ---

"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  BarChart3,
  Home,
  MapPin,
  Sparkles,
  Inbox,
  MessageCircle,
  Mail,
  FileText,
  type LucideIcon,
} from "lucide-react";

import { AuthProvider, useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { cn } from "@/utils/cn";

// --- Sidebar navigation items (Russian-only) ---

const navItems: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/ru/admin", label: "Главная", icon: BarChart3 },
  { href: "/ru/admin/properties", label: "Объекты", icon: Home },
  { href: "/ru/admin/locations", label: "Локации", icon: MapPin },
  { href: "/ru/admin/amenities", label: "Удобства", icon: Sparkles },
  { href: "/ru/admin/inquiries", label: "Запросы", icon: Inbox },
  { href: "/ru/admin/comments", label: "Комментарии", icon: MessageCircle },
  { href: "/ru/admin/subscribers", label: "Подписчики", icon: Mail },
  { href: "/ru/admin/posts", label: "Блог", icon: FileText },
];

// --- Auth guard wrapper ---

function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isAdmin } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // → login page is inside admin route group but doesn't need auth
  const isLoginPage = pathname.endsWith("/admin/login");

  useEffect(() => {
    if (isLoading) return;

    if (!user && !isLoginPage) {
      router.replace("/ru/admin/login");
    }

    if (user && !isAdmin && !isLoginPage) {
      router.replace("/ru/admin/login");
    }

    // → redirect away from login if already authenticated as admin
    if (user && isAdmin && isLoginPage) {
      router.replace("/ru/admin");
    }
  }, [user, isLoading, isAdmin, isLoginPage, router]);

  // → show loading while checking auth
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <p className="text-sm text-muted">Загрузка...</p>
      </div>
    );
  }

  // → login page renders without shell
  if (isLoginPage) {
    return <>{children}</>;
  }

  // → not authenticated yet — guard will redirect
  if (!user || !isAdmin) {
    return null;
  }

  return <AdminShell>{children}</AdminShell>;
}

// --- Sidebar content (shared between mobile drawer and desktop sidebar) ---

function SidebarContent({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <>
      {/* → match top bar height (h-16) so sidebar header aligns with main header */}
      <div className="flex h-16 items-center justify-between border-b border-hairline px-5">
        <h1 className="font-display text-lg font-semibold text-ink">
          Админ-панель
        </h1>
        {onNavigate && (
          <button
            type="button"
            className="rounded-full p-1.5 text-muted hover:bg-surface-soft hover:text-ink md:hidden"
            onClick={onNavigate}
            aria-label="Закрыть меню"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>
      <nav className="flex-1 space-y-0.5 px-3 py-4">
        {navItems.map((item) => {
          const isActive =
            item.href === "/ru/admin"
              ? pathname === "/ru/admin"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                // → Airbnb: 8px radius nav items, 44px min tap target
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-surface-soft text-ink"
                  : "text-muted hover:bg-surface-soft hover:text-ink",
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}

// --- Admin shell (sidebar + topbar + content) ---

function AdminShell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // → close sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  return (
    <div className="flex min-h-screen bg-white">
      {/* --- Mobile overlay (Airbnb scrim at 50% opacity) --- */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      {/* --- Mobile drawer sidebar --- */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-white shadow-card transition-transform duration-200 md:hidden",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <SidebarContent pathname={pathname} onNavigate={closeSidebar} />
      </aside>

      {/* --- Desktop sidebar --- */}
      <aside className="hidden w-64 flex-col border-r border-hairline bg-white md:flex">
        <SidebarContent pathname={pathname} />
      </aside>

      {/* --- Main area --- */}
      <div className="flex flex-1 flex-col">
        {/* --- Top bar (Airbnb: 80px on desktop, hairline bottom border) --- */}
        <header className="flex h-16 items-center justify-between border-b border-hairline bg-white px-4 md:justify-end md:px-8">
          {/* --- Hamburger (mobile only) --- */}
          <button
            type="button"
            className="rounded-full p-2 text-ink hover:bg-surface-soft md:hidden"
            onClick={() => setSidebarOpen(true)}
            aria-label="Открыть меню"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
              />
            </svg>
          </button>

          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-muted sm:inline">
              {user?.email}
            </span>
            <Button variant="ghost" size="sm" onClick={logout}>
              Выйти
            </Button>
          </div>
        </header>

        {/* --- Content (Airbnb: generous padding) --- */}
        <main className="flex-1 bg-surface-soft p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}

// --- Layout export ---

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      {/* → prevent search engines from indexing admin pages */}
      <meta name="robots" content="noindex, nofollow" />
      <AdminGuard>{children}</AdminGuard>
    </AuthProvider>
  );
}
