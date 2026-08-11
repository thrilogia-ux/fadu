import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getGoogleOAuthEnv } from "@/lib/google-auth-env";
import { prepareAuthRuntimeEnv } from "@/lib/auth-runtime-env";

prepareAuthRuntimeEnv();

const googleOAuth = getGoogleOAuthEnv();

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  events: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google" && user.id) {
        const picture =
          (profile as { picture?: string | null })?.picture ??
          user.image ??
          null;
        if (picture) {
          await prisma.user.update({
            where: { id: user.id },
            data: { image: picture },
          });
        }
      }
    },
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
    ...(googleOAuth.configured
      ? [
          Google({
            clientId: googleOAuth.clientId,
            clientSecret: googleOAuth.clientSecret,
            allowDangerousEmailAccountLinking: true,
            profile(profile) {
              return {
                id: profile.sub,
                name: profile.name,
                email: profile.email,
                image: profile.picture,
              };
            },
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
      }

      if (token.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { role: true, name: true, image: true },
        });
        if (dbUser) {
          token.role = dbUser.role;
          if (dbUser.name) token.name = dbUser.name;
          if (dbUser.image) token.picture = dbUser.image;
        }
      }

      if (user?.id) {
        token.role =
          token.role ?? (user as { role?: string }).role ?? "user";
      }
      if (trigger === "update" && session) {
        token.name = session.name;
        if ("image" in session) {
          token.picture = session.image ?? undefined;
        }
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
