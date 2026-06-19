import { AuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { supabase } from '@/lib/supabase';

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Admin Panel',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'admin@morrow.map' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        const adminEmail = process.env.ADMIN_EMAIL || 'lawrence.dizon@proton.me';

        // Limit access to the designated admin email only
        if (!credentials?.email || !credentials?.password || credentials.email !== adminEmail) {
          return null;
        }

        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email: credentials.email,
            password: credentials.password,
          });

          if (error || !data?.user) {
            return null;
          }

          return {
            id: data.user.id,
            name: 'Administrator',
            email: data.user.email || adminEmail,
          };
        } catch (err) {
          console.error('Supabase Auth error during NextAuth authorize:', err);
          return null;
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 1 day
  },
  pages: {
    signIn: '/admin-management/login',
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
