// --- LOGIN FORM — AUTH FEATURE ---

"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod/v4";
import { useRouter } from "next/navigation";

import { useAuth } from "@/context/AuthContext";
import { ApiRequestError } from "@/lib/api/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

// --- Validation schema ---

const loginSchema = z.object({
  email: z.email("Введите корректный email"),
  password: z.string().min(8, "Минимум 8 символов"),
});

type LoginFormData = z.infer<typeof loginSchema>;

// --- Component ---

export function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  // --- Submit handler ---

  const onSubmit = async (data: LoginFormData) => {
    setServerError(null);

    try {
      await login(data);
      router.push("/ru/admin");
    } catch (error) {
      if (error instanceof ApiRequestError) {
        if (error.status === 401) {
          setServerError("Неверный email или пароль");
        } else if (error.status === 429) {
          setServerError("Слишком много попыток. Подождите несколько минут.");
        } else {
          setServerError("Ошибка сервера. Попробуйте позже.");
        }
      } else {
        setServerError("Ошибка сервера. Попробуйте позже.");
      }
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-2">
      {serverError && (
        <div
          className="mb-4 rounded-lg bg-coral-soft px-4 py-3 text-sm text-coral-dark"
          role="alert"
        >
          {serverError}
        </div>
      )}

      <Input
        id="email"
        type="email"
        label="Email"
        placeholder="admin@example.com"
        autoComplete="email"
        error={errors.email?.message}
        {...register("email")}
      />

      <Input
        id="password"
        type="password"
        label="Пароль"
        placeholder="••••••••"
        autoComplete="current-password"
        error={errors.password?.message}
        {...register("password")}
      />

      <Button type="submit" isLoading={isSubmitting} className="w-full">
        Войти
      </Button>
    </form>
  );
}
