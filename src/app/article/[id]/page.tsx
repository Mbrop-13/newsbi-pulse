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

  if (!article) {
    return {
      title: "Artículo no encontrado | NewsBI Pulse",
      description: "El artículo que buscas no existe o ha sido removido.",
    };
  }

  return {
    title: `${article.title} | NewsBI Pulse`,
    description: article.summary,
    authors: article.author ? [{ name: article.author }] : undefined,
    openGraph: {
      title: article.title,
      description: article.summary,
      type: "article",
      images: article.image_url ? [{ url: article.image_url }] : [],
      siteName: "NewsBI Pulse",
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.summary,
      images: article.image_url ? [article.image_url] : [],
    },
  };
}

export { default } from "./article-client";
