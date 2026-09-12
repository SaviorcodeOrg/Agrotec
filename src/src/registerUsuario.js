import pool from './db.js'

// Creates a Vendedor or Comprador row (depending on `vendedor`), then a
// linked Usuario row pointing at it, inside one transaction - so a failure
// on either insert leaves neither behind.
export async function registerUsuario({
    vendedor,
    auth0Sub,
    Username,
    Nombre,
    Apellidos,
    Email,
    Telefono,
    // Vendedor-only fields
    Nombre_Negocio,
    Identificacion_URL,
    Foto_URL,
    Ubicaion_Aproximada,
    // Comprador-only fields
    A_Quien_Compro,
    Fecha,
    Modalidad_De_Entrega
}) {
    const client = await pool.connect()

    try {
        await client.query('BEGIN')

        let vendedorId = null
        let compradorId = null

        if (vendedor) {
            const result = await client.query(
                `INSERT INTO "Vendedor"
                    ("Nombre", "Apellidos", "Nombre_Negocio", "Identificacion_URL", "Foto_URL", "Ubicaion_Aproximada")
                 VALUES ($1, $2, $3, $4, $5, $6)
                 RETURNING id`,
                [Nombre, Apellidos, Nombre_Negocio, Identificacion_URL, Foto_URL, Ubicaion_Aproximada]
            )
            vendedorId = result.rows[0].id
        } else {
            const result = await client.query(
                `INSERT INTO "Comprador"
                    ("Nombre", "Apellidos", "Identificacion_URL", "Foto_URL", "A_Quien_Compro", "Fecha", "Modalidad_De_Entrega")
                 VALUES ($1, $2, $3, $4, $5, $6, $7)
                 RETURNING id`,
                [Nombre, Apellidos, Identificacion_URL, Foto_URL, A_Quien_Compro, Fecha, Modalidad_De_Entrega]
            )
            compradorId = result.rows[0].id
        }

        const usuarioResult = await client.query(
            `INSERT INTO "Usuario"
                ("id_Vendedor", "ID_comprador", "Username", "Nombre", "Email", "Telefono", "Auth0Sub")
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING *`,
            [vendedorId, compradorId, Username, `${Nombre} ${Apellidos || ''}`.trim(), Email, Telefono, auth0Sub]
        )

        await client.query('COMMIT')

        return {
            vendedorId,
            compradorId,
            usuario: usuarioResult.rows[0]
        }
    } catch (err) {
        await client.query('ROLLBACK')
        throw err
    } finally {
        client.release()
    }
}
