import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";

interface ArticlePageProps {
  params: Promise<{ id: string }>;
}

async function getArticleBySlugOrId(id: string) {
  const supabase = await createClient();
  
  // Try ID first if it looks like a UUID
  const isUuid = id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
  
  let query = supabase.from("news_articles").select("*");
  
  if (isUuid) {
    const { data: byId } = await query.eq("id", id).single();
    if (byId) return byId;
  }
  
  const { data: bySlug } = await supabase.from("news_articles").select("*").eq("slug", id).single();
  return bySlug;
}

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { id } = await params;
  const article = await getArticleBySlugOrId(id);
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://reclu.vercel.app";

  if (!article) {
    return {
      title: "Artículo no encontrado | NewsBI Pulse",
      description: "El artículo que buscas no existe o ha sido removido.",
    };
  }

  const ogImageUrl = new URL(`${baseUrl}/api/og`);
  ogImageUrl.searchParams.set('title', article.title);
  ogImageUrl.searchParams.set('category', article.category);
  if (article.image_url) {
    ogImageUrl.searchParams.set('image', article.image_url);
  }

  return {
    title: `${article.title} | NewsBI Pulse`,
    description: article.summary,
    authors: article.author ? [{ name: article.author }] : undefined,
    alternates: {
      canonical: `${baseUrl}/article/${article.slug || article.id}`,
    },
    openGraph: {
      title: article.title,
      description: article.summary,
      url: `${baseUrl}/article/${article.slug || article.id}`,
      type: "article",
      images: [{ url: ogImageUrl.toString(), width: 1200, height: 630 }],
      siteName: "Reclu",
      publishedTime: article.published_at,
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.summary,
      images: [ogImageUrl.toString()],
    },
  };
}

export default async function ArticlePageWrapper({ params }: ArticlePageProps) {
  const { id } = await params;
  const article = await getArticleBySlugOrId(id);
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://reclu.vercel.app";

  if (!article) {
    return <ArticleClient />;
  }

  // Structured Data (JSON-LD) for NewsArticle
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: article.title,
    image: article.image_url ? [article.image_url] : [],
    datePublished: article.published_at,
    dateModified: article.updated_at || article.published_at,
    author: [{
      "@type": "Person",
      name: article.author || "Reclu AI",
    }],
    publisher: {
      "@type": "Organization",
      name: "Reclu",
      logo: {
        "@type": "ImageObject",
        url: `${baseUrl}/favicon.ico`,
      },
    },
    description: article.summary,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${baseUrl}/article/${article.slug || article.id}`,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ArticleClient />
    </>
  );
}

import ArticleClient from "./article-client";
