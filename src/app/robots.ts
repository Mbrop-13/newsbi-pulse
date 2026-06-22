import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://maverlang.cl';

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/api/', '/profile/', '/guardados/', '/lista-lectura/'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
