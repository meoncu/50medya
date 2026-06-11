export const config = { runtime: 'edge' }

const COBALT_API = 'https://co.wuk.sh/api/json'

export default async function handler(req: Request) {
  const { searchParams } = new URL(req.url)
  const url = searchParams.get('url')
  const type = searchParams.get('type') || 'video'

  console.log('Download API called with:', { url, type })

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
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        url,
        videoQuality: '720', // Faster response
        filenameStyle: 'basic',
        downloadMode: 'auto'
      }),
    })

    console.log('Cobalt response status:', cobaltRes.status)

    if (!cobaltRes.ok) {
      const errorText = await cobaltRes.text()
      console.error('Cobalt error response:', errorText)
      throw new Error('Cobalt API error: ' + errorText)
    }

    const data = await cobaltRes.json()
    console.log('Cobalt data:', data)
    // Cobalt returns 'url', 'stream', or 'picker'
    const downloadUrl = data.url || data.stream || (data.picker && data.picker[0]?.url) || null

    console.log('Returning downloadUrl:', downloadUrl)

    return new Response(JSON.stringify({ downloadUrl, status: data.status }), { headers })
  } catch (err) {
    console.error('Download handler error:', err)
    return new Response(
      JSON.stringify({ error: 'Download service unavailable', downloadUrl: null }),
      { status: 200, headers }
    )
  }
}
