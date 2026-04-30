import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://reclu.vercel.app';

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/api/', '/profile/', '/guardados/', '/lista-lectura/', '/soporte/'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
