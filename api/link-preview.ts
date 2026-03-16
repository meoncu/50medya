export const config = { runtime: 'edge' }

const API_KEY = process.env.VITE_GEMINI_API_KEY ||
  process.env.GEMINI_API_KEY ||
  'AIzaSyDBCRjZYrpFHrRqlPW8ju4jgvEI7FxJiEI';

function decodeHtml(html: string): string {
  if (!html) return '';
  return html
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x131;/g, "ı")
    .replace(/&#x130;/g, "İ")
    .replace(/&#x15F;/g, "ş")
    .replace(/&#x15E;/g, "Ş")
    .replace(/&#x11F;/g, "ğ")
    .replace(/&#x11E;/g, "Ğ")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(dec))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
}

async function translateText(text: string): Promise<string> {
  if (!text || text.length < 10) return text;

  try {
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
    'Cache-Control': 'no-store, no-cache, must-revalidate'
  }

  let targetUrl = originalUrl.trim()
  const isTwitter = targetUrl.includes('x.com') || targetUrl.includes('twitter.com')
  const isInstagram = targetUrl.includes('instagram.com')

  const proxyImage = (url: string) => {
    if (!url) return ''
    // Use weserv.nl to bypass referer/CORS blocks. 
    // It's very effective for Twitter and Instagram CDN links.
    if (url.includes('twimg.com') || url.includes('cdninstagram.com') || url.includes('fbcdn.net') || url.includes('instagram.com')) {
      return `https://images.weserv.nl/?url=${encodeURIComponent(url)}&default=identicon`
    }
    return url
  }

  let result = {
    title: '',
    description: '',
    thumbnail: '',
    platform: isTwitter ? 'twitter' : (isInstagram ? 'instagram' : 'other'),
    url: originalUrl
  }

  // --- 1. DATA FETCHING ---
  
  // A. Twitter Handling
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

  // B. Instagram Handling
  if (isInstagram) {
    // 1. Try to get thumbnail via direct media endpoint (works for most public posts)
    const idMatch = targetUrl.match(/\/(?:p|reel|tv)\/([A-Za-z0-9_-]+)/)
    if (idMatch) {
      const shortcode = idMatch[1]
      result.thumbnail = `https://images.weserv.nl/?url=${encodeURIComponent(`https://www.instagram.com/p/${shortcode}/media/?size=l`)}&default=identicon`
    }

    // 2. Scraping for text
    const scrapUrls = [
      targetUrl.replace('instagram.com', 'ddinstagram.com'),
      targetUrl.includes('?') ? targetUrl.split('?')[0] + 'embed/captioned/' : (targetUrl.endsWith('/') ? targetUrl + 'embed/captioned/' : targetUrl + '/embed/captioned/')
    ]

    for (const urlToScrap of scrapUrls) {
      if (result.description && result.title && result.thumbnail) break;
      try {
        const res = await fetch(urlToScrap, { 
          headers: { 'User-Agent': 'facebookexternalhit/1.1' },
          timeout: 4000
        })
        if (res.ok) {
          const html = await res.text()
          const getMeta = (p: string) => {
            const r = new RegExp(`<meta[^>]+(?:property|name)=["'](?:og:|twitter:)?${p}["'][^>]+content=["']([^"']+)["']`, 'i')
            return html.match(r)?.[1] || ''
          }
          
          if (!result.description) result.description = getMeta('description')
          if (!result.title || result.title.includes('Instagram')) {
             const ogTitle = getMeta('og:title') || getMeta('title')
             if (ogTitle && !ogTitle.includes('Instagram')) result.title = ogTitle
          }
          // If we don't have a thumbnail yet or native media failed, try og:image from ddinstagram
          if (!result.thumbnail || result.thumbnail.includes('identicon')) {
             const ogImage = getMeta('image') || getMeta('image:src')
             if (ogImage) result.thumbnail = proxyImage(ogImage)
          }
        }
      } catch (e) { }
    }
  }

  // C. General Scraping fallback
  if (!result.description && !result.title) {
    try {
      const res = await fetch(targetUrl, { headers: { 'User-Agent': 'facebookexternalhit/1.1' } })
      if (res.ok) {
        const html = await res.text()
        const getMeta = (p: string) => {
          const r = new RegExp(`<meta[^>]+(?:property|name)=["'](?:og:|twitter:)?${p}["'][^>]+content=["']([^"']+)["']`, 'i')
          return html.match(r)?.[1] || ''
        }
        result.title = getMeta('title') || html.match(/<title>([^<]+)<\/title>/i)?.[1] || ''
        result.description = getMeta('description') || ''
        if (!result.thumbnail) {
          result.thumbnail = proxyImage(getMeta('image') || getMeta('image:src') || getMeta('twitter:image') || '')
        }
      }
    } catch (e) { }
  }

  // Final fallback text
  if (!result.title) {
    if (isTwitter) result.title = 'X (Twitter) Paylaşımı'
    else if (isInstagram) result.title = 'Instagram Paylaşımı'
    else result.title = originalUrl
  }

  // --- 2. AI TRANSLATION ---
  const textToTranslate = result.description || result.title;
  if (textToTranslate && textToTranslate.length > 8 && textToTranslate !== originalUrl) {
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

  return new Response(JSON.stringify({
    ...result,
    title: decodeHtml(result.title),
    description: decodeHtml(result.description)
  }), { headers: corsHeaders })
}
