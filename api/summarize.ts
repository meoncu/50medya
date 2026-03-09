export default async function handler(req: Request) {
    const { searchParams } = new URL(req.url)
    const url = searchParams.get('url')

    // Try everything to get the API key
    const apiKey = process.env.VITE_GEMINI_API_KEY ||
        process.env.GEMINI_API_KEY ||
        'AIzaSyDBCRjZYrpFHrRqlPW8ju4jgvEI7FxJiEI'; // Priority given to the new key

    if (!url) return new Response('URL required', { status: 400 })

    try {
        const prompt = `Lütfen şu YouTube videosunu detaylıca analiz et ve Türkçe bir özet oluştur. Video içeriğindeki önemli noktaları maddeler halinde belirt: ${url}`

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        })

        const data = await response.json()

        if (!response.ok) {
            console.error('Gemini API Error:', data)
            return new Response(JSON.stringify({ error: data.error?.message || 'Gemini API call failed' }), {
                status: response.status,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
            })
        }

        const summary = data.candidates?.[0]?.content?.parts?.[0]?.text || "Özet oluşturulamadı."

        return new Response(JSON.stringify({ summary }), {
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        })
    } catch (error) {
        console.error('Summary handler error:', error)
        return new Response(JSON.stringify({ error: 'Summary service failed' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        })
    }
}
