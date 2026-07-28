// src/auth.ts
import NextAuth from "next-auth";
import { db } from "@/lib/db";
import { authConfig } from "@/auth.config";
import Credentials from "next-auth/providers/credentials";
import { LoginSchema } from "@/schemas";
import bcrypt from "bcryptjs";

export const {
  handlers,
  auth,
  signIn,
  signOut,
} = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      async authorize(credentials) {
        const validatedFields = LoginSchema.safeParse(credentials);
        
        if (validatedFields.success) {
          const { email, password } = validatedFields.data;
          
          const user = await db.user.findFirst({
            where: { userName: email }
          });
          
          if (!user || !user.passwordHash) return null;
          
          const passwordsMatch = await bcrypt.compare(password, user.passwordHash);
          
          if (passwordsMatch) {
            return {
              id: user.id.toString(),
              name: user.fullName,
              email: user.userName,
              role: user.role,
            };
          }
        }
        return null;
      }
    })
  ],
});