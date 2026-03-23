import { NextRequest, NextResponse } from "next/server";

// ── NewsData.io Fetch API Route ──────────────────────
// Fetches latest news from NewsData.io API
// Categories: tech, business, politics
// Languages: es (Spanish)
// Countries: cl (Chile), us, global

interface NewsDataArticle {
  article_id: string;
  title: string;
  description: string;
  content: string;
  link: string;
  source_id: string;
  source_name: string;
  image_url: string | null;
  category: string[];
  pubDate: string;
  creator: string[] | null;
}

export async function GET(request: NextRequest) {
  try {
    const apiKey = process.env.NEWSDATA_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "NEWSDATA_API_KEY not configured" },
        { status: 500 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get("category") || "technology";
    const language = searchParams.get("language") || "es";
    const country = searchParams.get("country") || "cl";

    const url = new URL("https://newsdata.io/api/1/latest");
    url.searchParams.set("apikey", apiKey);
    url.searchParams.set("language", language);
    url.searchParams.set("country", country);
    url.searchParams.set("category", category);
    url.searchParams.set("size", "10");

    const response = await fetch(url.toString(), {
      next: { revalidate: 300 }, // Cache for 5 minutes
    });

    if (!response.ok) {
      throw new Error(`NewsData API error: ${response.status}`);
    }

    const data = await response.json();

    // Transform to our format
    const articles = (data.results || []).map((item: NewsDataArticle) => ({
      id: item.article_id,
      title: item.title,
      description: item.description || "",
      content: item.content || "",
      original_source: item.source_name || item.source_id,
      source_url: item.link,
      image_url: item.image_url,
      category: mapCategory(item.category),
      tags: item.category || [],
      author: item.creator?.[0] || null,
      published_at: item.pubDate,
    }));

    return NextResponse.json({
      success: true,
      articles,
      totalResults: data.totalResults,
      nextPage: data.nextPage,
    });
  } catch (error: unknown) {
    console.error("News fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch news", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

function mapCategory(categories: string[]): string {
  if (!categories || categories.length === 0) return "general";
  const cat = categories[0].toLowerCase();
  if (cat.includes("tech") || cat.includes("science")) return "tech";
  if (cat.includes("business") || cat.includes("econom")) return "business";
  if (cat.includes("politic")) return "politics";
  if (cat.includes("sport")) return "sports";
  if (cat.includes("entertain")) return "entertainment";
  return "general";
}
