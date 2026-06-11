export const config = { runtime: 'edge' }

const COBALT_APIS = [
  'https://api.cobalt.tools/api/json',
  'https://co.wuk.sh/api/json'
]

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

  let lastError: any = null

  for (const apiUrl of COBALT_APIS) {
    try {
      console.log('Trying API:', apiUrl)
      const cobaltRes = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          url,
          videoQuality: '720',
          filenameStyle: 'basic',
          downloadMode: 'auto'
        }),
      })

      console.log('Cobalt response status:', cobaltRes.status, 'for', apiUrl)

      if (!cobaltRes.ok) {
        const errorText = await cobaltRes.text()
        console.error('Cobalt error response for', apiUrl, ':', errorText)
        lastError = errorText
        continue
      }

      const data = await cobaltRes.json()
      console.log('Cobalt data:', data)
      const downloadUrl = data.url || data.stream || (data.picker && data.picker[0]?.url) || null

      console.log('Returning downloadUrl:', downloadUrl)

      return new Response(JSON.stringify({ downloadUrl, status: data.status }), { headers })
    } catch (err) {
      console.error('Error with', apiUrl, ':', err)
      lastError = err
      continue
    }
  }

  console.error('All APIs failed:', lastError)
  return new Response(
    JSON.stringify({ error: 'Download service unavailable', details: lastError, downloadUrl: null }),
    { status: 200, headers }
  )
}