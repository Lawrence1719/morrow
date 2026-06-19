import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://morrow-world.vercel.app';

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: '/admin-management',
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
