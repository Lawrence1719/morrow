import withAuth from 'next-auth/middleware';

export default withAuth;

export const config = {
  matcher: [
    // Protect /admin-management and any subroutes, but exclude /admin-management/login
    '/admin-management((?!/login).*)',
  ],
};
