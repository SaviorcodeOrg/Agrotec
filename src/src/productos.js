import pool from './db.js'

// Encuentra el id_Vendedor ligado a un usuario ya autenticado con Auth0.
// Devuelve null si el usuario existe pero es Comprador (o si el sub no
// tiene ningun Usuario todavia).
async function obtenerVendedorId(auth0Sub) {
    const { rows } = await pool.query(
        `SELECT "id_Vendedor" FROM "Usuario" WHERE "Auth0Sub" = $1`,
        [auth0Sub]
    )
    return rows[0]?.id_Vendedor ?? null
}

// Registra un nuevo Producto para el Vendedor autenticado. No se le pide el
// Vendedor_id al cliente - se resuelve del lado del servidor a partir del
// sub verificado del token, para que nadie pueda registrar un producto a
// nombre de otro vendedor.
export async function registrarProducto(auth0Sub, {
    Nombre_Producto,
    Precio,
    Cantidad_Disponible,
    Descripcion,
    Unidad_De_Venta,
    MInimo_De_Compra,
    Foto_Producto_URL
}) {
    const vendedorId = await obtenerVendedorId(auth0Sub)

    if (!vendedorId) {
        const err = new Error('Esta cuenta no tiene un perfil de Vendedor registrado')
        err.statusCode = 403
        throw err
    }

    const { rows } = await pool.query(
        `INSERT INTO "Producto"
            ("Vendedor_id", "Nombre_Producto", "Precio", "Cantidad_Disponible", "Descripcion", "Unidad_De_Venta", "MInimo_De_Compra", "Foto_Producto_URL")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [vendedorId, Nombre_Producto, Precio, Cantidad_Disponible, Descripcion, Unidad_De_Venta, MInimo_De_Compra, Foto_Producto_URL]
    )

    return rows[0]
}

// El catalogo publico, anonimizado: agrupado por Nombre_Producto, sin
// exponer id de Producto ni Vendedor_id - varios vendedores pueden tener
// el mismo producto listado (con precio/stock distintos), y aqui se ven
// como una sola entrada combinada, igual que /api/comprar y
// /api/elegir-vendedor los tratan como un solo "pool" anonimo. Solo
// productos con stock; uno que llega a 0 en todos los vendedores
// desaparece automaticamente de aqui.
export async function obtenerCatalogo() {
    const { rows } = await pool.query(`
        SELECT
            "Nombre_Producto",
            MIN("Precio") AS "precioDesde",
            SUM("Cantidad_Disponible") AS "cantidadTotal",
            MAX("Descripcion") AS "Descripcion",
            MAX("Foto_Producto_URL") AS "Foto_Producto_URL",
            MAX("Unidad_De_Venta") AS "Unidad_De_Venta",
            MAX("MInimo_De_Compra") AS "MInimo_De_Compra"
        FROM "Producto"
        WHERE "Cantidad_Disponible" > 0
        GROUP BY "Nombre_Producto"
        ORDER BY "Nombre_Producto"
    `)

    return rows
}

// Todos los productos del Vendedor autenticado (su propia galeria de venta,
// incluyendo los que ya se agotaron - a diferencia del catalogo publico,
// que solo debe mostrar los que tienen stock).
export async function obtenerMisProductos(auth0Sub) {
    const vendedorId = await obtenerVendedorId(auth0Sub)

    if (!vendedorId) {
        const err = new Error('Esta cuenta no tiene un perfil de Vendedor registrado')
        err.statusCode = 403
        throw err
    }

    const { rows } = await pool.query(
        `SELECT * FROM "Producto" WHERE "Vendedor_id" = $1 ORDER BY id DESC`,
        [vendedorId]
    )

    return rows
}
