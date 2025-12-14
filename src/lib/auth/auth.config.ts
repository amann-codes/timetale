import { PrismaAdapter } from "@auth/prisma-adapter";
import { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import prisma from "../db/prisma";

export const authOptions = {
  debug: true,
  adapter: PrismaAdapter(prisma),
  providers: [
    Google
  ],
  callbacks: {
    jwt: async ({ user, token }) => {
      if (user) {
        token.userId = user.id || token.sub;
      }
      return token;
    },
    session: ({ session, token }: any) => {
      if (session.user) {
        session.user.id = token.userId;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth",
  },
  session: {
    strategy: "jwt",
  },
} satisfies NextAuthConfig;
