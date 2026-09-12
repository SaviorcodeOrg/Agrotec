import { generarJSON } from './gemini.js'

const ESQUEMA_MENSAJE = {
    type: 'OBJECT',
    properties: {
        mensajeComercial: { type: 'STRING' },
        tono: { type: 'STRING', enum: ['cordial', 'neutral', 'vulgar'] },
        ajusteDificultad: { type: 'INTEGER' },
    },
    required: ['mensajeComercial', 'tono', 'ajusteDificultad'],
}

// Reescribe el mensaje de un Vendedor (a menudo informal/rural, a veces
// grosero) en tono comercial para que lo lea el Comprador - la "IA
// intermediaria" del chat efimero comprador-vendedor. También evalúa el
// TONO del mensaje ORIGINAL (no el reescrito) para ajustar su
// "Dificultad" (ver elegirVendedor.js): cordial resta puntos (más
// paciente), vulgar/agresivo suma (más difícil).
export async function traducirMensajeVendedor(mensajeOriginal) {
    const prompt = `Eres un traductor comercial para una plataforma agrícola. Un vendedor (agricultor) escribió el siguiente mensaje a un comprador, en lenguaje informal o rural, posiblemente con groserías.

Tu trabajo:
1. Reescribe el mensaje en español profesional y comercial, conservando toda la información importante (precios, cantidades, fechas, ubicaciones), pero sin groserías, insultos, ni informalidades excesivas.
2. Evalúa el TONO del mensaje ORIGINAL (no el reescrito):
   - "cordial": amable, respetuoso, servicial.
   - "neutral": normal, ni especialmente amable ni grosero.
   - "vulgar": contiene groserías, insultos, agresividad, o desprecio hacia el comprador.
3. Sugiere un ajuste entero a su puntaje de "Dificultad" (mientras más alto, más difícil es tratar con esa persona): -1 si es cordial, 0 si es neutral, entre 1 y 3 si es vulgar (más alto mientras más agresivo).

Mensaje original: "${mensajeOriginal}"`

    return generarJSON(prompt, ESQUEMA_MENSAJE)
}
