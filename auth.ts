import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" }, // credentials no persiste en DB session; usar JWT para incluir role
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const user = await prisma.user.findUnique({
          where: { email: String(credentials.email) },
        });
        if (!user?.passwordHash) return null;
        const ok = await bcrypt.compare(
          String(credentials.password),
          user.passwordHash
        );
        if (!ok) return null;
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
        };
      },
    }),
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            allowDangerousEmailAccountLinking: true,
          }),
        ]
      : []),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user?.id) {
        token.id = user.id;
        token.name = user.name ?? undefined;
        token.picture = user.image ?? undefined;

        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { role: true, name: true, image: true },
        });
        token.role =
          dbUser?.role ?? (user as { role?: string }).role ?? "user";
        if (dbUser?.name) token.name = dbUser.name;
        if (dbUser?.image) token.picture = dbUser.image;
      }
      if (trigger === "update" && session) {
        token.name = session.name;
        token.picture = session.image;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as { role?: string }).role = token.role as string;
        session.user.name = (token.name as string | undefined) ?? session.user.name;
        session.user.image = (token.picture as string | undefined) ?? session.user.image;
      }
      return session;
    },
  },
});
