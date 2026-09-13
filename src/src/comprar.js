import pool from './db.js'
import nessie from './nessieisreal.js'
import { elegirVendedor } from './elegirVendedor.js'

const TASA_IMPUESTO = 0.03

// Encuentra el ID_comprador ligado a un usuario ya autenticado con Auth0.
async function obtenerCompradorId(auth0Sub) {
    const { rows } = await pool.query(
        `SELECT "ID_comprador" FROM "Usuario" WHERE "Auth0Sub" = $1`,
        [auth0Sub]
    )
    return rows[0]?.ID_comprador ?? null
}

// Nessie devuelve texto plano (ver nessie-api.md) - todo lo que llamamos
// aqui necesita JSON.parse() antes de poder leer sus campos.
function parsearRespuestaNessie(texto, contexto) {
    try {
        return JSON.parse(texto)
    } catch {
        const err = new Error(`Respuesta inesperada de Nessie al ${contexto}: ${texto}`)
        err.statusCode = 502
        throw err
    }
}

// Un Comprador no tiene identidad en Nessie hasta su primera compra - se
// crea un customer + una cuenta la primera vez que la necesita, y se
// guarda en su fila para reusarla en compras futuras.
async function obtenerOCrearCuentaNessie(compradorId) {
    const { rows } = await pool.query(
        `SELECT "NessieAccountId", "Nombre", "Apellidos" FROM "Comprador" WHERE id = $1`,
        [compradorId]
    )
    const comprador = rows[0]

    if (!comprador) {
        const err = new Error('Comprador no encontrado')
        err.statusCode = 404
        throw err
    }

    if (comprador.NessieAccountId) {
        return comprador.NessieAccountId
    }

    const customerTexto = await nessie.create_customer({
        first_name: comprador.Nombre,
        last_name: comprador.Apellidos,
        address: {
            street_number: '0',
            street_name: 'NA',
            city: 'NA',
            state: 'NA',
            zip: '00000',
        },
    })
    const customer = parsearRespuestaNessie(customerTexto, 'crear customer')
    const customerId = customer.objectCreated._id

    const accountTexto = await nessie.create_account_for_customer(customerId, {
        type: 'Checking',
        nickname: 'Cuenta Agrotec',
        rewards: 0,
        balance: 1000,
    })
    const account = parsearRespuestaNessie(accountTexto, 'crear cuenta')
    const accountId = account.objectCreated._id

    await pool.query(
        `UPDATE "Comprador" SET "NessieCustomerId" = $1, "NessieAccountId" = $2 WHERE id = $3`,
        [customerId, accountId, compradorId]
    )

    return accountId
}

// Un Vendedor no tiene identidad en Nessie hasta su primera venta - mismo
// patron que obtenerOCrearCuentaNessie() para el Comprador, pero sobre la
// tabla Vendedor.
async function obtenerOCrearCuentaNessieVendedor(vendedorId) {
    const { rows } = await pool.query(
        `SELECT "NessieAccountId", "Nombre", "Apellidos" FROM "Vendedor" WHERE id = $1`,
        [vendedorId]
    )
    const vendedor = rows[0]

    if (!vendedor) {
        const err = new Error('Vendedor no encontrado')
        err.statusCode = 404
        throw err
    }

    if (vendedor.NessieAccountId) {
        return vendedor.NessieAccountId
    }

    const customerTexto = await nessie.create_customer({
        first_name: vendedor.Nombre,
        last_name: vendedor.Apellidos,
        address: {
            street_number: '0',
            street_name: 'NA',
            city: 'NA',
            state: 'NA',
            zip: '00000',
        },
    })
    const customer = parsearRespuestaNessie(customerTexto, 'crear customer de vendedor')
    const customerId = customer.objectCreated._id

    const accountTexto = await nessie.create_account_for_customer(customerId, {
        type: 'Checking',
        nickname: 'Ventas Agrotec',
        rewards: 0,
        balance: 0,
    })
    const account = parsearRespuestaNessie(accountTexto, 'crear cuenta de vendedor')
    const accountId = account.objectCreated._id

    await pool.query(
        `UPDATE "Vendedor" SET "NessieCustomerId" = $1, "NessieAccountId" = $2 WHERE id = $3`,
        [customerId, accountId, vendedorId]
    )

    return accountId
}

// Compra `cantidad` unidades de `Nombre_Producto` para el Comprador
// autenticado. Flujo completo:
//   1. elegirVendedor() decide qué Vendedor surte la compra (rotación +
//      calificación + choque de dificultad - ver elegirVendedor.js).
//   2. Descuenta el stock de ese Producto especifico (con lock de fila,
//      para evitar que dos compras simultaneas vendan de mas) y actualiza
//      Ultima_Venta del Vendedor, para que la proxima elegirVendedor() ya
//      lo tome en cuenta.
//   3. Le retira el dinero al Comprador mediante un withdrawal real en
//      Nessie sobre su cuenta.
//   4. Crea un Bill real en Nessie como recibo/factura de la compra.
//
// Nota: los pasos 3 y 4 son llamadas externas a Nessie que ocurren DESPUES
// de que el descuento de stock ya se confirmo en la base de datos. Si
// Nessie falla, el stock ya quedo descontado y no hay una compensacion
// automatica - aceptable para este stack de desarrollo, pero es lo primero
// a resolver antes de usar esto en produccion.
export async function comprarProducto(auth0Sub, { Nombre_Producto, cantidad }) {
    const compradorId = await obtenerCompradorId(auth0Sub)

    if (!compradorId) {
        const err = new Error('Esta cuenta no tiene un perfil de Comprador registrado')
        err.statusCode = 403
        throw err
    }

    const elegido = await elegirVendedor(Nombre_Producto, cantidad, compradorId)

    if (!elegido) {
        const err = new Error('No hay vendedores disponibles con ese producto y esa cantidad')
        err.statusCode = 404
        throw err
    }

    const client = await pool.connect()
    let producto

    try {
        await client.query('BEGIN')

        const productoResult = await client.query(
            `SELECT * FROM "Producto" WHERE id = $1 FOR UPDATE`,
            [elegido.producto_id]
        )
        producto = productoResult.rows[0]

        if (!producto || producto.Cantidad_Disponible < cantidad) {
            throw Object.assign(new Error('Ya no hay suficiente stock para esta compra'), { statusCode: 409 })
        }

        await client.query(
            `UPDATE "Producto" SET "Cantidad_Disponible" = "Cantidad_Disponible" - $1 WHERE id = $2`,
            [cantidad, producto.id]
        )

        await client.query(
            `UPDATE "Vendedor" SET "Ultima_Venta" = now() WHERE id = $1`,
            [elegido.vendedor_id]
        )

        await client.query('COMMIT')
    } catch (err) {
        await client.query('ROLLBACK')
        throw err
    } finally {
        client.release()
    }

    const subtotal = Number(producto.Precio) * cantidad
    const impuesto = Math.round(subtotal * TASA_IMPUESTO * 100) / 100
    const total = Math.round((subtotal + impuesto) * 100) / 100
    const accountId = await obtenerOCrearCuentaNessie(compradorId)

    const retiroTexto = await nessie.create_withdrawal_for_account(accountId, {
        medium: 'balance',
        amount: total,
        description: `Compra: ${Nombre_Producto} x${cantidad} (incluye 3% impuesto Agrotec)`,
    })
    const retiro = parsearRespuestaNessie(retiroTexto, 'crear el retiro')

    // Paga al Vendedor su parte de la venta (el subtotal, sin el 3% de
    // impuesto Agrotec) depositandolo en su propia cuenta de Nessie -
    // antes de esto, ningun Vendedor recibia dinero simulado por sus
    // ventas. El "amount" de Deposit se trunca a dolares enteros en este
    // sandbox (ver nessie-api.md), asi que se omite si redondea a $0.
    const pagoVendedor = Math.round(subtotal)
    if (pagoVendedor > 0) {
        const cuentaVendedorId = await obtenerOCrearCuentaNessieVendedor(elegido.vendedor_id)
        await nessie.create_deposit_for_account(cuentaVendedorId, {
            medium: 'balance',
            amount: pagoVendedor,
            transaction_date: new Date().toISOString().slice(0, 10),
            status: 'completed',
            description: `Venta: ${Nombre_Producto} x${cantidad}`,
        })
    }

    // El Bill de Nessie no tiene un campo propio para un desglose de
    // impuesto - se codifica en el nickname (unico campo libre disponible)
    // separado por "||" para que /api/facturas/:id lo pueda separar en
    // subtotal/impuesto al mostrar el recibo.
    const facturaTexto = await nessie.create_bill_for_account(accountId, {
        status: 'completed',
        payee: 'Agrotec',
        nickname: `${Nombre_Producto} x${cantidad}||${subtotal.toFixed(2)}||${impuesto.toFixed(2)}`,
        payment_date: new Date().toISOString().slice(0, 10),
        payment_amount: total,
        // Required so Nessie can compute upcoming_payment_date at create
        // time - BillCreate rejects upcoming_payment_date if you pass it
        // directly ("extra fields not permitted"), but Bill's read schema
        // requires it, so recurring_date is the only way to make a bill
        // actually readable afterward via get_bill_by_id().
        recurring_date: new Date().getDate(),
    })
    const factura = parsearRespuestaNessie(facturaTexto, 'crear la factura')
    const facturaId = factura.objectCreated._id

    return {
        producto: {
            id: producto.id,
            Nombre_Producto,
            cantidad,
            precioUnitario: Number(producto.Precio),
            subtotal,
            impuesto,
            total,
        },
        retiro: retiro.objectCreated,
        factura: {
            id: facturaId,
            url: `/api/facturas/${facturaId}`,
        },
    }
}
