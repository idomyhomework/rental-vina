// --- ADMIN DASHBOARD — PAGE ---

"use client";

import { Home, Inbox, MessageCircle, Mail, type LucideIcon } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

// --- Stat card data (placeholder) ---

const stats: { label: string; value: string; icon: LucideIcon }[] = [
  { label: "Объекты", value: "—", icon: Home },
  { label: "Запросы", value: "—", icon: Inbox },
  { label: "Комментарии", value: "—", icon: MessageCircle },
  { label: "Подписчики", value: "—", icon: Mail },
];

// --- Page ---

// → Airbnb: display-lg for page title, generous section spacing
export default function AdminDashboardPage() {
  return (
    <div className="space-y-8">
      <h2 className="text-[22px] font-medium text-ink">
        Панель управления
      </h2>

      {/* --- Stats grid (Airbnb: 16px gap, card density) --- */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="p-5">
            <CardHeader className="mb-3">
              <div className="flex items-center gap-2.5">
                <stat.icon className="h-5 w-5 text-sea" aria-hidden="true" />
                <CardTitle className="text-sm font-medium text-muted">
                  {stat.label}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold tracking-tight text-ink">
                {stat.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* --- Recent activity placeholder --- */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">
            Последние действия
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted">
            Здесь будут отображаться последние запросы и комментарии.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
