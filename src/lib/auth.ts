import { NextAuthOptions, Session } from "next-auth";
import { JWT } from "next-auth/jwt";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import EmailProvider from "next-auth/providers/email";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
    // @ts-ignore - PrismaAdapter types mismatch slightly with NextAuth v4 sometimes
    adapter: PrismaAdapter(prisma),
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || "MISSING_GOOGLE_CLIENT_ID",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "MISSING_GOOGLE_CLIENT_SECRET",
        }),
        EmailProvider({
            server: process.env.EMAIL_SERVER || "smtp://localhost:25",
            from: process.env.EMAIL_FROM || "noreply@sisub.com",
        }),
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email", placeholder: "you@example.com" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    return null;
                }

                const user = await prisma.user.findUnique({
                    where: { email: credentials.email }
                });

                if (!user || user.password !== credentials.password) {
                    return null;
                }

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                };
            }
        })
    ],
    // We must use JWT strategy if using CredentialsProvider, even with a database adapter
    session: { strategy: "jwt" },
    callbacks: {
        async jwt({ token, user }: { token: JWT; user?: { id?: string; email?: string | null; name?: string | null } }) {
            if (user?.id) {
                token.id = user.id;
            }
            return token;
        },
        async session({ session, token }: { session: Session; token: JWT }) {
            if (token?.id && session.user) {
                (session.user as { id?: string }).id = token.id as string;
            }
            return session;
        }
    },
    pages: {
        signIn: '/login',
    },
    secret: process.env.NEXTAUTH_SECRET || "fallback_secret_for_build",
};
