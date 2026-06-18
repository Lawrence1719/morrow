import { AuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Admin Panel',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'admin@morrow.map' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@morrow.map';
        const adminPassword = process.env.ADMIN_PASSWORD || 'adminpassword123';

        if (
          credentials?.email === adminEmail &&
          credentials?.password === adminPassword
        ) {
          return {
            id: 'admin',
            name: 'Administrator',
            email: adminEmail,
          };
        }
        return null;
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 1 day
  },
  pages: {
    signIn: '/admin/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = 'admin';
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
      }
      return session;
    }
  },
  secret: process.env.NEXTAUTH_SECRET,
};
