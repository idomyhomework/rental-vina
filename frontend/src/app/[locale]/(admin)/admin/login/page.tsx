// --- ADMIN LOGIN — PAGE ---

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { LoginForm } from "@/features/auth/components/LoginForm";

// → Airbnb: white canvas, centered card with brand shadow
export default function AdminLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4">
      <div className="w-full max-w-[400px]">
        <Card className="px-8 py-10">
          <CardHeader>
            <CardTitle className="text-[22px] font-medium">
              Вход в панель управления
            </CardTitle>
          </CardHeader>
          <CardContent>
            <LoginForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
