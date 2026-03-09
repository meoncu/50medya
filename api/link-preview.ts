export const config = { runtime: 'edge' }

const API_KEY = process.env.VITE_GEMINI_API_KEY ||
  process.env.GEMINI_API_KEY ||
  'AIzaSyDBCRjZYrpFHrRqlPW8ju4jgvEI7FxJiEI';

async function translateText(text: string): Promise<string> {
  if (!text || text.length < 10) return text;

  try {
    // A more explicit prompt to ensure translation happens
    const prompt = `Task: Translate the following social media post into natural, current Turkish. 
    Rule 1: If it's already in Turkish, return it as is. 
    Rule 2: Otherwise, provide a high-quality Turkish translation. 
    Rule 3: Maintain emojis and tone.
    Rule 4: Return ONLY the resulting text.
    
    Content: "${text}"`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2 }
      })
    });

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || text;
  } catch (err) {
    console.error('AI Translation error:', err);
    return text;
  }
}

export default async function handler(req: Request) {
  const { searchParams } = new URL(req.url)
  const originalUrl = searchParams.get('url')

  if (!originalUrl) {
    return new Response(JSON.stringify({ error: 'url parameter required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  }

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store, no-cache, must-revalidate' // Prevent caching issues
  }

  // Normalize URL
  let targetUrl = originalUrl.trim()
  const isTwitter = targetUrl.includes('x.com') || targetUrl.includes('twitter.com')

  // Helper to proxy images
  const proxyImage = (url: string) => {
    if (!url) return ''
    if (url.includes('twimg.com') || url.includes('x.com') || url.includes('twitter.com') || url.includes('fxtwitter.com')) {
      return `https://images.weserv.nl/?url=${encodeURIComponent(url)}&default=identicon`
    }
    return url
  }

  let result = {
    title: '',
    description: '',
    thumbnail: '',
    platform: isTwitter ? 'twitter' : 'other',
    url: originalUrl
  }

  // --- 1. DATA FETCHING ---
  if (isTwitter) {
    const statusId = targetUrl.match(/status\/(\d+)/)?.[1]
    if (statusId) {
      const proxies = [
        `https://api.fxtwitter.com/status/${statusId}`,
        `https://vxtwitter.com/status/${statusId}`
      ]
      for (const p of proxies) {
        try {
          const res = await fetch(p, { headers: { 'Accept': 'application/json' }, timeout: 4000 })
          if (res.ok) {
            const data = await res.json()
            const tweet = data.tweet || data
            if (tweet) {
              result.description = tweet.text || tweet.description || ''
              result.title = result.description.slice(0, 100).replace(/\n/g, ' ')
              result.thumbnail = proxyImage(tweet.media?.all?.[0]?.url || tweet.media_extended?.[0]?.url || tweet.thumbnail_url || tweet.author?.avatar_url || '')
              break
            }
          }
        } catch (e) { }
      }
    }
  }

  // Scraping fallback if needed
  if (!result.description && !result.title) {
    try {
      const res = await fetch(targetUrl, { headers: { 'User-Agent': 'facebookexternalhit/1.1 Twitterbot/1.0' } })
      if (res.ok) {
        const html = await res.text()
        const getMeta = (p: string) => {
          const r = new RegExp(`<meta[^>]+(?:property|name)=["'](?:og:|twitter:)?${p}["'][^>]+content=["']([^"']+)["']`, 'i')
          return html.match(r)?.[1] || ''
        }
        result.title = getMeta('title') || html.match(/<title>([^<]+)<\/title>/i)?.[1] || ''
        result.description = getMeta('description') || ''
        result.thumbnail = proxyImage(getMeta('image') || getMeta('image:src') || getMeta('twitter:image') || '')
      }
    } catch (e) { }
  }

  // Final fallback text
  if (!result.title) result.title = isTwitter ? 'X (Twitter) Paylaşımı' : originalUrl

  // --- 2. AI TRANSLATION ---
  // Translate if it's more than just a link and we have content
  const textToTranslate = result.description || result.title;
  if (textToTranslate && textToTranslate.length > 8 && textToTranslate !== originalUrl) {
    // Even if it has Turkish chars, user might be forcing update. 
    // AI is smart enough to handle "already Turkish"
    const translated = await translateText(textToTranslate);
    if (translated && translated !== textToTranslate) {
      if (result.description) {
        result.description = translated;
        result.title = translated.slice(0, 100).replace(/\n/g, ' ');
      } else {
        result.title = translated;
      }
    }
  }

  return new Response(JSON.stringify(result), { headers: corsHeaders })
}
