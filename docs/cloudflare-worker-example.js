// This is an example Cloudflare Worker that proxies Gemini API calls
// Deploy this to Cloudflare Workers and use it instead of calling Gemini directly

export default {
    async fetch(request, env) {
        // Only allow requests from your domain
        const origin = request.headers.get('Origin');
        const allowedOrigins = [
            'https://zed00-hub.github.io',
            'http://localhost:3000'
        ];

        if (!allowedOrigins.includes(origin)) {
            return new Response('Forbidden', { status: 403 });
        }

        // Only allow POST requests
        if (request.method !== 'POST') {
            return new Response('Method not allowed', { status: 405 });
        }

        try {
            const body = await request.json();

            // Forward the request to Gemini API with your secret key
            const geminiResponse = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/${body.model}:generateContent?key=${env.GEMINI_API_KEY}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(body.contents),
                }
            );

            const data = await geminiResponse.json();

            return new Response(JSON.stringify(data), {
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': origin,
                },
            });
        } catch (error) {
            return new Response(JSON.stringify({ error: error.message }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            });
        }
    },
};

/*
SETUP INSTRUCTIONS:
1. Create a Cloudflare account at https://cloudflare.com
2. Go to Workers & Pages → Create Worker
3. Paste this code
4. Add environment variable GEMINI_API_KEY with your API key
5. Deploy and use the worker URL in your frontend instead of calling Gemini directly
*/
