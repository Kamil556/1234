import NextAuth, { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
  },
  callbacks: {
    // Сохраняем Google sub (уникальный ID пользователя) в JWT
    async jwt({ token, account, profile }) {
      if (account?.provider === 'google' && profile?.sub) {
        token.googleId = profile.sub
      }
      return token
    },
    // Передаём googleId в session как user.id
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.googleId ?? token.sub
      }
      return session
    },
  },
}

export default NextAuth(authOptions)
