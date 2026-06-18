import withAuth from 'next-auth/middleware';

export default withAuth;

export const config = {
  matcher: [
    // Protect /admin and any subroutes, but exclude /admin/login
    '/admin((?!/login).*)',
  ],
};
