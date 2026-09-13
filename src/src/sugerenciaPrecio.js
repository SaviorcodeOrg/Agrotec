const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const MODELO = 'gemini-3.6-flash'
const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models'

// No se puede usar generarJSON() (gemini.js) aqui: ese usa
// responseSchema/responseMimeType para forzar JSON, pero Gemini no permite
// combinar eso con el tool de busqueda (google_search) en la misma
// llamada - grounding necesita texto libre para poder intercalar
// resultados de busqueda. Por eso esta funcion pide el precio en un
// formato de texto simple y facil de parsear (una linea final
// "PRECIO_SUGERIDO: <numero>") en vez de JSON estructurado.
export async function sugerirPrecio(nombreProducto, descripcion) {
    if (!GEMINI_API_KEY) {
        const err = new Error('GEMINI_API_KEY no está configurada')
        err.statusCode = 503
        throw err
    }

    const prompt = `Eres un asistente financiero para agricultores mexicanos que venden sus productos en un marketplace agrícola en México. Un vendedor está registrando este producto:

Nombre: ${nombreProducto}
Descripción: ${descripcion || '(sin descripción)'}

Busca en internet precios actuales/reales de este producto en mercados y tiendas de México (por kilo, unidad, o como normalmente se venda) para sugerir un precio de venta justo y competitivo en pesos mexicanos (MXN).

Responde en español, de forma breve (máximo 3 párrafos cortos), explicando en qué te basaste (rangos de precio que encontraste, de dónde). Termina tu respuesta EXACTAMENTE con esta línea, sin nada más después:

PRECIO_SUGERIDO: <número, solo dígitos y un punto decimal opcional, sin símbolo de moneda>`

    const res = await fetch(
        `${BASE_URL}/${MODELO}:generateContent?key=${GEMINI_API_KEY}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                tools: [{ google_search: {} }],
            }),
        }
    )

    const data = await res.json()

    if (!res.ok) {
        const err = new Error(data.error?.message || `Gemini respondió ${res.status}`)
        err.statusCode = 502
        throw err
    }

    const candidato = data.candidates?.[0]
    const texto = candidato?.content?.parts?.map((p) => p.text).join('') ?? ''

    if (!texto) {
        const err = new Error('Gemini no devolvió contenido utilizable')
        err.statusCode = 502
        throw err
    }

    const match = texto.match(/PRECIO_SUGERIDO:\s*([\d]+(?:\.[\d]+)?)/i)

    if (!match) {
        const err = new Error('Gemini no devolvió un precio en el formato esperado')
        err.statusCode = 502
        throw err
    }

    const precioSugerido = Number(match[1])
    const justificacion = texto.slice(0, match.index).trim()

    // Los links reales que Gemini uso para fundamentar la busqueda -
    // refuerza que la sugerencia viene de datos reales, no solo del
    // conocimiento interno del modelo.
    const fuentes = (candidato?.groundingMetadata?.groundingChunks ?? [])
        .map((chunk) => chunk.web && { titulo: chunk.web.title, url: chunk.web.uri })
        .filter(Boolean)

    return { precioSugerido, justificacion, fuentes }
}
