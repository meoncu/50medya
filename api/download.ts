export const config = { runtime: 'edge' }

const COBALT_API = 'https://api.cobalt.tools'

export default async function handler(req: Request) {
  const { searchParams } = new URL(req.url)
  const url = searchParams.get('url')
  const type = searchParams.get('type') || 'video'

  if (!url) {
    return new Response(JSON.stringify({ error: 'url required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  }

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  }

  if (type === 'image') {
    return new Response(JSON.stringify({ downloadUrl: url }), { headers })
  }

  try {
    const cobaltRes = await fetch(COBALT_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ url, videoQuality: '1080', filenameStyle: 'basic' }),
    })

    if (!cobaltRes.ok) throw new Error('Cobalt API error')

    const data = await cobaltRes.json()
    const downloadUrl = data.url || data.stream || null

    return new Response(JSON.stringify({ downloadUrl, status: data.status }), { headers })
  } catch {
    return new Response(
      JSON.stringify({ error: 'Download service unavailable', downloadUrl: null }),
      { status: 200, headers }
    )
  }
}
