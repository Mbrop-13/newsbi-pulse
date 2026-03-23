import { NextRequest, NextResponse } from "next/server";

// ── YouTube Live Detection API Route ──────────────
// Detects live streams from specific channels
// (White House, major news, tech events)

export async function GET(request: NextRequest) {
  try {
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "YOUTUBE_API_KEY not configured" },
        { status: 500 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q") || "White House live";

    // Search for live streams
    const url = new URL("https://www.googleapis.com/youtube/v3/search");
    url.searchParams.set("part", "snippet");
    url.searchParams.set("q", query);
    url.searchParams.set("type", "video");
    url.searchParams.set("eventType", "live");
    url.searchParams.set("maxResults", "5");
    url.searchParams.set("key", apiKey);

    const response = await fetch(url.toString(), {
      next: { revalidate: 180 }, // Cache for 3 minutes
    });

    if (!response.ok) {
      throw new Error(`YouTube API error: ${response.status}`);
    }

    const data = await response.json();

    const liveStreams = (data.items || []).map(
      (item: {
        id: { videoId: string };
        snippet: {
          title: string;
          channelTitle: string;
          description: string;
          thumbnails: { high: { url: string } };
        };
      }) => ({
        videoId: item.id.videoId,
        title: item.snippet.title,
        channel: item.snippet.channelTitle,
        description: item.snippet.description,
        thumbnail: item.snippet.thumbnails?.high?.url,
        url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
        embedUrl: `https://www.youtube.com/embed/${item.id.videoId}`,
      })
    );

    return NextResponse.json({
      success: true,
      liveStreams,
      query,
    });
  } catch (error: unknown) {
    console.error("YouTube API error:", error);
    return NextResponse.json(
      { error: "Failed to search YouTube", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
