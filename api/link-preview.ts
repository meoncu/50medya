export const config = { runtime: 'edge' }

export default async function handler(req: Request) {
  const { searchParams } = new URL(req.url)
  const url = searchParams.get('url')

  if (!url) {
    return new Response(JSON.stringify({ error: 'url parameter required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  }

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; 50Medya/1.0)',
      },
    })

    if (!res.ok) throw new Error('Fetch failed')

    const html = await res.text()

    function getMeta(property: string): string {
      const patterns = [
        new RegExp(`<meta[^>]+property=["']og:${property}["'][^>]+content=["']([^"']+)["']`, 'i'),
        new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:${property}["']`, 'i'),
        new RegExp(`<meta[^>]+name=["']twitter:${property}["'][^>]+content=["']([^"']+)["']`, 'i'),
        new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:${property}["']`, 'i'),
      ]
      for (const p of patterns) {
        const m = html.match(p)
        if (m?.[1]) return m[1].trim()
      }
      return ''
    }

    function getTitle(): string {
      const og = getMeta('title')
      if (og) return og
      const m = html.match(/<title[^>]*>([^<]+)<\/title>/i)
      return m?.[1]?.trim() ?? ''
    }

    const title = getTitle()
    const description = getMeta('description')
    const thumbnail = getMeta('image')

    return new Response(JSON.stringify({ title, description, thumbnail, url }), {
      headers: corsHeaders,
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Preview fetch failed', title: '', description: '', thumbnail: '' }), {
      status: 200,
      headers: corsHeaders,
    })
  }
}
