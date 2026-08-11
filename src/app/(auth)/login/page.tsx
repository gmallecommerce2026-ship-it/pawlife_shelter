"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";
import { GiPawPrint } from "react-icons/gi";
import { LoginSchema } from "@/schemas";
import { loginWebAction } from "@/actions/auth-actions";
import Image from "next/image";

export default function LoginPage() {
  const [error, setError] = useState<string | undefined>("");
  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof LoginSchema>>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = (values: z.infer<typeof LoginSchema>) => {
    setError("");
    startTransition(async () => {
      const res = await loginWebAction(values);
      if (!res?.success) {
        setError(res?.error || "Đã xảy ra lỗi");
      } else {
        // LƯU TOKEN VÀO BỘ NHỚ TRÌNH DUYỆT
        if (res.token && typeof window !== 'undefined') {
          localStorage.setItem('token', res.token);
          localStorage.setItem('accessToken', res.token);
        }
        
        window.location.assign("/shelter/pets");
      }
    });
  };

  return (
    <div className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-gray-200/50 p-8 md:p-10 border border-gray-100">
      <div className="flex flex-col items-center mb-8">
        <div className="h-[80px] flex items-center justify-between px-6 border-b border-gray-100">
          <Link href="/shelter/pets" className="block transition-transform hover:scale-105 shrink-0 pt-1">
            <Image
              src="/images/logo/pawlife-logo.png"
              alt="PawLife Logo"
              width={40}
              height={40}
              priority
              className="object-contain"
            />
          </Link>
        </div>

        <h1 className="text-2xl font-bold text-[#123832]">Shelter Admin</h1>
        <p className="text-gray-500 text-sm mt-2">Đăng nhập vào bảng điều khiển</p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1.5 block">Email</label>
          <input
            {...form.register("email")}
            disabled={isPending}
            type="email"
            placeholder="admin@shelter.com"
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[#123832] focus:border-[#E89B5A] focus:ring-2 focus:ring-[#E89B5A]/20 focus:outline-none transition-colors"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 mb-1.5 block">Mật khẩu</label>
          <input
            {...form.register("password")}
            disabled={isPending}
            type="password"
            placeholder="••••••••"
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[#123832] focus:border-[#E89B5A] focus:ring-2 focus:ring-[#E89B5A]/20 focus:outline-none transition-colors"
          />
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 border border-red-100 p-3 rounded-lg text-sm text-center font-medium">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="w-full py-3.5 bg-[#E89B5A] text-white rounded-xl font-bold hover:bg-[#D68B4E] transition-all shadow-md shadow-teal-500/30 disabled:opacity-70 mt-2"
        >
          {isPending ? "Đang xử lý..." : "Đăng nhập"}
        </button>
      </form>
    </div>
  );
}