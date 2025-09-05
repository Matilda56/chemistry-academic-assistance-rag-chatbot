export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const resp = await fetch('http://127.0.0.1:8000/api/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ instruction: body?.question ?? '' }),
    });
    const data = await resp.json().catch(() => ({}));
    return new Response(JSON.stringify({ answer: data.answer ?? data.output ?? '' }), {
      status: resp.status,
      headers: { 'content-type': 'application/json' },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message ?? 'proxy error' }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }
}
