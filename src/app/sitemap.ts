import { MetadataRoute } from 'next';
import { createClient } from '@/lib/supabase/server';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://reclu.cl';
  const supabase = await createClient();

  // Rutas estáticas principales
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified: new Date(),
      changeFrequency: 'always',
      priority: 1,
    },
    {
      url: `${baseUrl}/mercados`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/predicciones`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/ai`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
  ];

  // Obtener artículos para el sitemap
  let articlesRoutes: MetadataRoute.Sitemap = [];
  
  try {
    const { data: articles } = await supabase
      .from('news_articles')
      .select('id, slug, updated_at')
      .order('updated_at', { ascending: false })
      .limit(1000); // Limit to recent 1000 to keep it manageable

    if (articles) {
      articlesRoutes = articles.map((article) => ({
        url: `${baseUrl}/article/${article.slug || article.id}`,
        lastModified: new Date(article.updated_at || new Date()),
        changeFrequency: 'daily',
        priority: 0.7,
      }));
    }
  } catch (error) {
    console.error('Error generating articles sitemap:', error);
  }

  // Categorías principales
  const categories = [
    'finanzas', 'inversiones', 'impacto-global', 
    'economia', 'tech-global', 'mundo'
  ];

  const categoryRoutes: MetadataRoute.Sitemap = categories.map((cat) => ({
    url: `${baseUrl}/${cat}`,
    lastModified: new Date(),
    changeFrequency: 'always',
    priority: 0.8,
  }));

  return [...staticRoutes, ...categoryRoutes, ...articlesRoutes];
}
