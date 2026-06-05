import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { queryOne } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import type { UserRow, UserRole } from "@/lib/types";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) return null;
        const user = await queryOne<UserRow>`
          select * from users where email = ${credentials.email.toLowerCase()} limit 1
        `;
        if (!user || user.status !== "active") return null;
        const ok = await verifyPassword(credentials.password, user.password_hash);
        if (!ok) return null;
        // Best-effort last-login stamp (don't fail auth if it errors).
        try {
          await queryOne`update users set last_login_at = now() where id = ${user.id}`;
        } catch {
          /* noop */
        }
        return { id: user.id, email: user.email, name: user.full_name, role: user.role };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.uid = (user as { id: string }).id;
        token.role = (user as { role: UserRole }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.uid as string;
        session.user.role = token.role as UserRole;
      }
      return session;
    },
  },
};
