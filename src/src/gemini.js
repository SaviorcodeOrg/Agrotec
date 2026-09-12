const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const MODELO = 'gemini-3.6-flash' // gemini-2.0-flash fue retirado por Google
const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models'

// Llama a Gemini pidiendo una respuesta que cumpla `schema` (formato
// Gemini responseSchema - ver https://ai.google.dev/gemini-api/docs/structured-output)
// y devuelve el objeto ya parseado. Lanza un error claro si no hay
// GEMINI_API_KEY configurada, en vez de fallar con un error críptico de
// fetch.
export async function generarJSON(prompt, schema) {
    if (!GEMINI_API_KEY) {
        const err = new Error('GEMINI_API_KEY no está configurada')
        err.statusCode = 503
        throw err
    }

    const res = await fetch(
        `${BASE_URL}/${MODELO}:generateContent?key=${GEMINI_API_KEY}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    responseMimeType: 'application/json',
                    responseSchema: schema,
                },
            }),
        }
    )

    const data = await res.json()

    if (!res.ok) {
        const err = new Error(data.error?.message || `Gemini respondió ${res.status}`)
        err.statusCode = 502
        throw err
    }

    const texto = data.candidates?.[0]?.content?.parts?.[0]?.text

    if (!texto) {
        const err = new Error('Gemini no devolvió contenido utilizable')
        err.statusCode = 502
        throw err
    }

    return JSON.parse(texto)
}
