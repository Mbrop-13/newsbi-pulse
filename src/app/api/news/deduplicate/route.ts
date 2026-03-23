import { NextRequest, NextResponse } from "next/server";

// ── Deduplication API Route ──────────────────────
// Uses sentence-transformers embeddings + cosine similarity
// to detect duplicate/similar news articles

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.HF_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "HF_API_KEY not configured" },
        { status: 500 }
      );
    }

    const { articles } = await request.json();

    if (!articles || !Array.isArray(articles) || articles.length === 0) {
      return NextResponse.json(
        { error: "Array of articles is required" },
        { status: 400 }
      );
    }

    // Generate embeddings for all articles
    const texts = articles.map(
      (a: { title: string; description?: string }) =>
        `${a.title} ${a.description || ""}`
    );

    const embeddingResponse = await fetch(
      "https://api-inference.huggingface.co/models/sentence-transformers/all-MiniLM-L6-v2",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: texts,
          options: { wait_for_model: true },
        }),
      }
    );

    if (!embeddingResponse.ok) {
      throw new Error(`HF embedding error: ${embeddingResponse.status}`);
    }

    const embeddings: number[][] = await embeddingResponse.json();

    // Cosine similarity clustering
    const SIMILARITY_THRESHOLD = 0.85;
    const groups: Map<number, string> = new Map(); // articleIndex -> group_id
    let groupCounter = 0;

    for (let i = 0; i < embeddings.length; i++) {
      if (groups.has(i)) continue;

      const groupId = `group_${Date.now()}_${groupCounter++}`;
      groups.set(i, groupId);

      for (let j = i + 1; j < embeddings.length; j++) {
        if (groups.has(j)) continue;

        const similarity = cosineSimilarity(embeddings[i], embeddings[j]);
        if (similarity >= SIMILARITY_THRESHOLD) {
          groups.set(j, groupId);
        }
      }
    }

    // Return articles with group_id and embeddings
    const deduplicatedArticles = articles.map(
      (article: Record<string, unknown>, index: number) => ({
        ...article,
        group_id: groups.get(index) || `group_single_${index}`,
        embedding: embeddings[index] || null,
      })
    );

    // Keep only the first article from each group
    const seenGroups = new Set<string>();
    const uniqueArticles = deduplicatedArticles.filter(
      (article: { group_id: string }) => {
        if (seenGroups.has(article.group_id)) return false;
        seenGroups.add(article.group_id);
        return true;
      }
    );

    return NextResponse.json({
      success: true,
      original_count: articles.length,
      deduplicated_count: uniqueArticles.length,
      groups_found: new Set(Array.from(groups.values())).size,
      articles: uniqueArticles,
    });
  } catch (error: unknown) {
    console.error("Dedup error:", error);
    return NextResponse.json(
      { error: "Deduplication failed", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// Cosine similarity between two vectors
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  return denominator === 0 ? 0 : dotProduct / denominator;
}
