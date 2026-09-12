import pool from './db.js'

// Penalización por emparejar a un comprador y un vendedor difíciles entre
// sí. Ahora mismo "Dificultad" siempre es 0 en ambas tablas (nada la
// actualiza todavía), así que este término no afecta nada hasta que algo
// empiece a modificarla.
const PESO_DIFICULTAD = 10

// Elige qué Vendedor debe surtir una compra de `nombreProducto`, entre
// todos los que tienen stock suficiente para `cantidadSolicitada`.
// Combina tres factores en un solo puntaje:
//
//   - Rotación: días desde su última venta (favorece a quien no ha vendido
//     hace más tiempo). Un vendedor que nunca ha vendido (Ultima_Venta NULL)
//     cuenta como el máximo. Tiene un tope de 90 días para que no domine
//     el puntaje frente a la calificación.
//   - Calificación: 1-5 estrellas (3, neutral, si todavía no tiene
//     calificación).
//   - Choque de dificultad: Dificultad del vendedor × Dificultad del
//     comprador - penaliza emparejar dos partes difíciles entre sí. Un
//     comprador difícil (Dificultad alta) automáticamente termina
//     empujado hacia vendedores de Dificultad baja (pacientes), y
//     viceversa.
//
// Devuelve { producto_id, vendedor_id, puntaje } del mejor candidato, o
// `null` si ningún vendedor tiene ese producto con suficiente stock.
export async function elegirVendedor(nombreProducto, cantidadSolicitada, compradorId) {
    const { rows } = await pool.query(
        `
        SELECT
            p.id AS producto_id,
            p."Vendedor_id" AS vendedor_id,
            (
              LEAST(COALESCE(EXTRACT(EPOCH FROM (now() - v."Ultima_Venta")) / 86400, 90), 90)
              + COALESCE(v."Calificacion", 3) * 20
              - (v."Dificultad" * COALESCE(c."Dificultad", 0)) * $4
            ) AS puntaje
        FROM "Producto" p
        JOIN "Vendedor" v ON v.id = p."Vendedor_id"
        LEFT JOIN "Comprador" c ON c.id = $3
        WHERE p."Nombre_Producto" = $1
          AND p."Cantidad_Disponible" >= $2
        ORDER BY puntaje DESC
        LIMIT 1
        `,
        [nombreProducto, cantidadSolicitada, compradorId, PESO_DIFICULTAD]
    )

    return rows[0] || null
}
