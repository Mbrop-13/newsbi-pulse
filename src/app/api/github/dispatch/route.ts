import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const pat = process.env.GITHUB_PAT;
    const owner = process.env.GITHUB_REPO_OWNER || 'Mbrop-13'; // Default to user's github from URL
    const repo = process.env.GITHUB_REPO_NAME || 'newsbi-pulse';

    if (!pat) {
      return NextResponse.json(
        { error: 'GITHUB_PAT environment variable not configured in Vercel' },
        { status: 500 }
      );
    }

    // Call GitHub API to trigger a repository dispatch event
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/dispatches`, {
      method: 'POST',
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'Authorization': `token ${pat}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        event_type: 'manual-pipeline-run'
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('GitHub API Error:', res.status, errText);
      return NextResponse.json(
        { error: `GitHub API responded with ${res.status}: ${errText}` },
        { status: res.status }
      );
    }

    return NextResponse.json({ success: true, message: 'GitHub Action dispatched successfully' });
  } catch (err: any) {
    console.error('Dispatch error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
