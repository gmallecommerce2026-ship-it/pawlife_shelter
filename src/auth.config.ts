// src/auth.config.ts
import type { NextAuthConfig } from "next-auth";
import { publicRoutes, authRoutes, apiAuthPrefix, shelterRoutesPrefix, DEFAULT_LOGIN_REDIRECT } from "@/routes";

export const authConfig = {
  providers: [],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const userRole = auth?.user?.role;
      const pathname = nextUrl.pathname;

      // 1. Cho phép tất cả API Auth
      if (pathname.startsWith(apiAuthPrefix)) return true;

      // 2. Xử lý trang Auth (Login/Register)
      if (authRoutes.includes(pathname)) {
        if (isLoggedIn) {
          return Response.redirect(new URL(DEFAULT_LOGIN_REDIRECT, nextUrl));
        }
        return true;
      }

      // 3. Xử lý route Shelter (Chỉ SHELTER_ADMIN mới được vào)
      if (pathname.startsWith(shelterRoutesPrefix)) {
        if (!isLoggedIn || userRole !== "SHELTER_ADMIN") return false;
        return true;
      }

      // 4. Các route public
      const isPublic = publicRoutes.some(route =>
        route === "/" ? pathname === "/" : pathname.startsWith(route)
      );
      if (isPublic) return true;

      // 5. Mặc định: Yêu cầu đăng nhập cho các route còn lại
      return isLoggedIn;
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.role = (user as any).role;
        token.name = user.name;
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        session.user.role = token.role as any;
        session.user.name = token.name;
        session.user.email = token.email as string;
      }
      return session;
    }
  }
} satisfies NextAuthConfig;