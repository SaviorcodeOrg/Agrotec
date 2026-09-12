import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import supabase from './supabase.js'
import nessie from './nessieisreal.js'
import { registerUsuario } from './registerUsuario.js'
import { elegirVendedor } from './elegirVendedor.js'
import { registrarProducto, obtenerMisProductos, obtenerCatalogo } from './productos.js'
import { comprarProducto } from './comprar.js'
import { checkJwt } from './auth0.js'
import pool from './db.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const app = express()
const api = express.Router()
const port = 3000

function main(){

    // The GUI (agrotec.saviorcode.com / localhost:5173) is a different
    // origin than this API (agrotecapi.saviorcode.com), so browser fetches
    // from it need CORS enabled here or they fail with "Failed to fetch".
    app.use(cors({
        origin: [
            'https://agrotec.saviorcode.com',
            'http://localhost:5173',
        ],
    }))
    app.use(express.json())
    app.use(express.static('dist'))

    api.get('/health', (req, res) => {
        res.sendStatus(200)
    })

    api.get('/test', (req, res) => {
        res.sendFile(path.join(__dirname, 'test.html'))
    })

    // Plain-text test page for the public catalog - no styling, just the
    // raw GET /api/productos response dumped into a <pre>.
    api.get('/test/catalogo', (req, res) => {
        res.sendFile(path.join(__dirname, 'catalogo-test.html'))
    })

    // Public copy of the Spanish React integration guide.
    api.get('/docs', (req, res) => {
        res.type('text/markdown; charset=utf-8')
        res.sendFile(path.join(__dirname, '..', 'dist', 'react-api.md'))
    })

    // Full reference for the internal nessieisreal.js wrapper module.
    api.get('/docs/nessie', (req, res) => {
        res.type('text/markdown; charset=utf-8')
        res.sendFile(path.join(__dirname, '..', 'dist', 'nessie-api.md'))
    })

    api.get('/', (req, res) => {
        res.send('request nulo por favor usa parametros')
    })

    // Registers a new Usuario as either a Vendedor or a Comprador, based on
    // the `vendedor` boolean, then links the new Usuario row to it. When
    // `vendedor` is true, also creates a matching Nessie merchant - this is
    // a best-effort mapping since our schema only stores a free-text
    // location (Ubicaion_Aproximada), not Nessie's structured
    // street/city/state/zip address.
    //
    // Requires a valid Auth0 access token (the user must already be logged
    // in via Auth0) - the Usuario row is linked to the verified token's
    // `sub`, never to a client-supplied value, so no one can register a
    // profile under someone else's Auth0 identity.
    api.post('/register', checkJwt, async (req, res) => {
        const { vendedor, Username, Nombre, Apellidos } = req.body
        const auth0Sub = req.auth.payload.sub

        if (typeof vendedor !== 'boolean') {
            return res.status(400).json({ error: 'vendedor must be a boolean' })
        }
        if (!Username) {
            return res.status(400).json({ error: 'Username is required' })
        }
        if (!Nombre || !Apellidos) {
            return res.status(400).json({ error: 'Nombre and Apellidos are required' })
        }

        try {
            const result = await registerUsuario({ ...req.body, auth0Sub })

            if (vendedor) {
                await nessie.create_merchant({
                    name: req.body.Nombre_Negocio || `${Nombre} ${Apellidos}`,
                    category: "general",
                    address: {
                        street_number: "0",
                        street_name: req.body.Ubicaion_Aproximada || "NA",
                        city: "NA",
                        state: "NA",
                        zip: "00000"
                    }
                })
            }

            res.status(201).json(result)
        } catch (err) {
            console.error(err)
            res.status(500).json({ error: 'Failed to register usuario', details: err.message })
        }
    })

    api.get('/getusers', async (req, res) => {
        res.send(`${await nessie.create_customer()}`)
    })

    // Foundation for the purchase flow, not wired to a real order yet:
    // given a product name, a quantity, and a comprador id, picks which
    // Vendedor should fulfill it. See elegirVendedor.js for the scoring.
    api.get('/elegir-vendedor', async (req, res) => {
        const { producto, cantidad, compradorId } = req.query

        if (!producto || !compradorId) {
            return res.status(400).json({ error: 'producto and compradorId are required' })
        }

        try {
            const elegido = await elegirVendedor(
                String(producto),
                Number(cantidad) || 1,
                Number(compradorId)
            )

            if (!elegido) {
                return res.status(404).json({ error: 'No hay vendedores disponibles con ese producto y esa cantidad' })
            }

            res.json(elegido)
        } catch (err) {
            console.error(err)
            res.status(500).json({ error: 'Failed to elegir vendedor', details: err.message })
        }
    })

    // Returns the caller's own Usuario row (looked up by the verified
    // token's `sub`), or 404 if they've logged in via Auth0 but haven't
    // completed the Vendedor/Comprador registration yet. Proves the whole
    // Auth0 -> backend token round-trip works.
    api.get('/perfil', checkJwt, async (req, res) => {
        const auth0Sub = req.auth.payload.sub

        try {
            const result = await pool.query(
                `SELECT * FROM "Usuario" WHERE "Auth0Sub" = $1`,
                [auth0Sub]
            )

            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'No hay un Usuario registrado para esta cuenta todavia', auth0Sub })
            }

            res.json(result.rows[0])
        } catch (err) {
            console.error(err)
            res.status(500).json({ error: 'Failed to fetch perfil', details: err.message })
        }
    })

    // Registers a new Producto for the calling Vendedor - the Vendedor_id
    // is resolved server-side from the verified token, never taken from
    // the client, so no one can list a product under someone else's name.
    // Public, anonymized catalog - no login needed, no seller identity in
    // the response. Grouped by Nombre_Producto (see productos.js), so
    // multiple vendedores selling "the same" product show up as one entry.
    api.get('/productos', async (req, res) => {
        try {
            const catalogo = await obtenerCatalogo()
            res.json(catalogo)
        } catch (err) {
            console.error(err)
            res.status(500).json({ error: 'Failed to fetch catalogo', details: err.message })
        }
    })

    api.post('/productos', checkJwt, async (req, res) => {
        const { Nombre_Producto, Precio, Cantidad_Disponible } = req.body

        if (!Nombre_Producto || Precio == null || Cantidad_Disponible == null) {
            return res.status(400).json({ error: 'Nombre_Producto, Precio and Cantidad_Disponible are required' })
        }

        try {
            const producto = await registrarProducto(req.auth.payload.sub, req.body)
            res.status(201).json(producto)
        } catch (err) {
            console.error(err)
            res.status(err.statusCode || 500).json({ error: err.message })
        }
    })

    // The calling Vendedor's own selling gallery - everything they've
    // registered, including sold-out items (unlike the public catalog,
    // which should only show products with stock).
    api.get('/mis-productos', checkJwt, async (req, res) => {
        try {
            const productos = await obtenerMisProductos(req.auth.payload.sub)
            res.json(productos)
        } catch (err) {
            console.error(err)
            res.status(err.statusCode || 500).json({ error: err.message })
        }
    })

    // Buys `cantidad` units of `Nombre_Producto` for the calling Comprador.
    // elegirVendedor() picks which Vendedor's listing to fulfill it from,
    // then this decrements that Producto's stock, withdraws the total from
    // the buyer's (lazily-provisioned) Nessie account, and creates a real
    // Nessie Bill as the receipt - see comprar.js for the full flow and its
    // caveats.
    api.post('/comprar', checkJwt, async (req, res) => {
        const { Nombre_Producto, cantidad } = req.body

        if (!Nombre_Producto || !cantidad || cantidad <= 0) {
            return res.status(400).json({ error: 'Nombre_Producto and a positive cantidad are required' })
        }

        try {
            const resultado = await comprarProducto(req.auth.payload.sub, { Nombre_Producto, cantidad })
            res.status(201).json(resultado)
        } catch (err) {
            console.error(err)
            res.status(err.statusCode || 500).json({ error: err.message })
        }
    })

    // Public, no-login-needed view of a receipt created by /api/comprar -
    // "viewable with a link" means anyone with the link can see it, same
    // as most real-world receipt links.
    api.get('/facturas/:id', async (req, res) => {
        try {
            const texto = await nessie.get_bill_by_id(req.params.id)
            const factura = JSON.parse(texto)

            if (factura.code === 404 || !factura._id) {
                return res.status(404).send('Factura no encontrada')
            }

            res.type('html').send(`
                <!doctype html>
                <html lang="es">
                <head><meta charset="utf-8"><title>Factura ${factura._id}</title></head>
                <body style="font-family: sans-serif; max-width: 400px; margin: 40px auto;">
                    <h1>Agrotec</h1>
                    <h2>Factura</h2>
                    <p><strong>Producto:</strong> ${factura.nickname}</p>
                    <p><strong>Monto:</strong> $${factura.payment_amount}</p>
                    <p><strong>Fecha:</strong> ${factura.payment_date}</p>
                    <p><strong>Estado:</strong> ${factura.status}</p>
                    <p><small>ID: ${factura._id}</small></p>
                </body>
                </html>
            `)
        } catch (err) {
            console.error(err)
            res.status(500).send('Error al obtener la factura')
        }
    })

    app.use('/api', api)

    // express-oauth2-jwt-bearer throws an UnauthorizedError for a missing/
    // invalid token - without this handler Express would return its
    // default HTML error page instead of JSON.
    app.use((err, req, res, next) => {
        if (err.name === 'UnauthorizedError') {
            return res.status(err.status).json({ error: err.message })
        }
        next(err)
    })

    app.listen(port, () => {
        console.log(`Example app listening on port ${port}`)
    })
}
export default main;
