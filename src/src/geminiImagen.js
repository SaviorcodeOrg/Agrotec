// Placeholder-image generation for products with no real photo, using
// Gemini's image generation. Not wired into any route yet - GEMINI_API_KEY
// isn't set. Once it is, replace the body of generarImagenProducto with a
// real call (e.g. to Gemini's generateContent endpoint with an image
// response modality) and return the resulting image URL/data.
const GEMINI_API_KEY = process.env.GEMINI_API_KEY

// Returns a placeholder image URL/description for a product based on its
// broad description (e.g. "Tomate rojo fresco"). Currently a stub: returns
// null (caller should fall back to a static placeholder) until a real key
// is configured.
export async function generarImagenProducto(descripcion) {
    if (!GEMINI_API_KEY) {
        return null
    }

    // TODO: call Gemini's image generation API with `descripcion` once
    // GEMINI_API_KEY is set, and return the generated image URL.
    return null
}
