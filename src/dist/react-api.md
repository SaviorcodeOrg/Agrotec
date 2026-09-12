# Guía de integración con React.js

Esta guía explica cómo consumir la API del backend (`app`, el servicio
Node.js de este stack) desde una aplicación React. Cubre todos los
endpoints disponibles y ejemplos de componentes listos para usar.

Todos los endpoints viven bajo el prefijo `/api`.

## URL base

En desarrollo local, si publicaste el puerto (ver `docker-compose.yml`,
sección `app` > `ports`):

```
http://localhost:3000
```

En producción:

```
https://agrotecapi.saviorcode.com
```

## Autenticación (Auth0)

La mayoría de los endpoints que escriben o leen datos de un usuario
específico requieren un **access token de Auth0** en el header
`Authorization`. Los endpoints públicos (listados abajo) no lo necesitan.

### Configuración de React

```bash
npm install @auth0/auth0-react
```

```jsx
// src/App.tsx (o main.tsx)
import { Auth0Provider } from '@auth0/auth0-react'
import { useNavigate } from 'react-router-dom'

function Auth0ProviderConNavegacion({ children }) {
  const navigate = useNavigate()

  return (
    <Auth0Provider
      domain="dev-sebkdm5n60dmbfjm.us.auth0.com"
      clientId="HtrLvS56mkueOr8n2UWkWrrW6JaSmyB6"
      authorizationParams={{
        redirect_uri: window.location.origin,
        audience: 'https://agrotecapi.saviorcode.com/',
      }}
      // Sin esto, un usuario ya logueado puede quedarse en isLoading=true
      // hasta 60s en cada carga de página si el chequeo silencioso por
      // iframe no responde (cookies de terceros bloqueadas, etc.).
      cacheLocation="localstorage"
      authorizeTimeoutInSeconds={5}
      onRedirectCallback={(appState) => navigate(appState?.returnTo || '/')}
    >
      {children}
    </Auth0Provider>
  )
}
```

**Importante:** `Auth0Provider` debe ir *dentro* de `BrowserRouter` (no en
`main.tsx` envolviendo todo desde afuera) para que `onRedirectCallback`
pueda usar `useNavigate` y regresar al usuario a la página donde estaba
(en vez de mandarlo siempre a `/`).

### Obtener el token y llamar a un endpoint protegido

```jsx
import { useAuth0 } from '@auth0/auth0-react'

function MiComponente() {
  const { getAccessTokenSilently } = useAuth0()

  async function llamarEndpointProtegido() {
    const token = await getAccessTokenSilently()

    const res = await fetch('https://agrotecapi.saviorcode.com/api/perfil', {
      headers: { Authorization: `Bearer ${token}` },
    })

    return res.json()
  }
}
```

### Gating de una página tras login

```jsx
const { isAuthenticated, isLoading, loginWithRedirect } = useAuth0()

if (isLoading) return null
if (!isAuthenticated) {
  return (
    <button onClick={() => loginWithRedirect({ appState: { returnTo: '/CrearCuenta' } })}>
      Iniciar sesion
    </button>
  )
}
// ... resto de la pagina
```

## Endpoints públicos (sin token)

| Método | Ruta            | Descripción                                                    |
|--------|-----------------|------------------------------------------------------------------|
| GET    | `/api/health`   | Health check. Devuelve `200` vacío. Usado por Docker.            |
| GET    | `/api/test`     | Página HTML simple para probar `/api/register` sin React.        |
| GET    | `/api/docs`     | Esta misma guía, en texto plano/Markdown.                         |
| GET    | `/api/`         | Mensaje de bienvenida genérico.                                   |
| GET    | `/api/getusers` | Llama a `create_customer()` de la API de Nessie. Ruta de prueba.  |
| GET    | `/api/elegir-vendedor` | Ver detalle abajo.                                         |

## `POST /api/register` 🔒

Registra un nuevo usuario como **Vendedor** o **Comprador**, según el campo
booleano `vendedor`. Requiere estar logueado con Auth0. Internamente:

- Crea una fila en la tabla `Vendedor` o `Comprador`.
- Crea una fila en `Usuario`, enlazada a la anterior y al `sub` verificado
  del token (nunca a un valor que mande el cliente).
- Si `vendedor` es `true`, también crea un *merchant* en la API de Nessie.

### Cuerpo de la petición (JSON)

Campos comunes (ambos casos):

| Campo      | Tipo    | Requerido |
|------------|---------|-----------|
| `vendedor` | boolean | Sí        |
| `Username` | string  | Sí        |
| `Nombre`   | string  | Sí        |
| `Apellidos`| string  | Sí        |
| `Email`    | string  | No        |
| `Telefono` | string  | No        |

Si `vendedor: true`, campos adicionales:

| Campo                  | Tipo   | Requerido |
|------------------------|--------|-----------|
| `Nombre_Negocio`       | string | No        |
| `Identificacion_URL`   | string | No        |
| `Foto_URL`             | string | No        |
| `Ubicaion_Aproximada`  | string | No        |

Si `vendedor: false`, campos adicionales:

| Campo                   | Tipo   | Requerido |
|-------------------------|--------|-----------|
| `Identificacion_URL`    | string | No        |
| `Foto_URL`              | string | No        |
| `A_Quien_Compro`        | string | No        |
| `Fecha`                 | string | No        |
| `Modalidad_De_Entrega`  | string | No        |

### Ejemplo de respuesta exitosa (`201`)

```json
{
  "vendedorId": "4",
  "compradorId": null,
  "usuario": {
    "id": 7,
    "id_Vendedor": "4",
    "ID_comprador": null,
    "Username": "auth0_wizard_test",
    "Nombre": "Ana Torres Vega",
    "Telefono": null,
    "Email": "test.agrotec.wizard@example.com",
    "id_activo": "4",
    "Auth0Sub": "auth0|6aa573072fbf3171ac72c31d"
  }
}
```

### Errores comunes

| Código | Causa                                                       |
|--------|--------------------------------------------------------------|
| `400`  | Falta `vendedor`, `Username`, `Nombre` o `Apellidos`         |
| `401`  | Falta el token, expiró, o es inválido                        |
| `500`  | Error de base de datos o al crear el *merchant* en Nessie     |

## `GET /api/perfil` 🔒

Devuelve la fila `Usuario` del usuario autenticado (buscada por su `sub` de
Auth0). Útil para saber si ya completó el registro de Vendedor/Comprador.

**Respuesta (`200`):** la fila `Usuario` completa (mismo shape que en
`/api/register`).

**`404`:** el usuario inició sesión con Auth0 pero todavía no llamó a
`/api/register`. La respuesta incluye el `auth0Sub` para depurar.

## `GET /api/productos`

Catálogo público y anonimizado - sin login, sin identidad de vendedor en la
respuesta. Agrupado por `Nombre_Producto`: si varios vendedores tienen el
mismo producto listado, aparecen como **una sola entrada combinada** (mismo
concepto anónimo que usan `/api/comprar` y `/api/elegir-vendedor`). Solo
incluye productos con stock - uno que se agota en todos los vendedores
desaparece automáticamente de aquí.

### Ejemplo de respuesta (`200`)

```json
[
  {
    "Nombre_Producto": "Tomate",
    "precioDesde": "25",
    "cantidadTotal": "200",
    "Descripcion": "Tomate rojo fresco",
    "Foto_Producto_URL": null,
    "Unidad_De_Venta": null,
    "MInimo_De_Compra": null
  }
]
```

`precioDesde` es el precio más bajo entre todos los vendedores de ese
producto (no necesariamente el que te va a tocar - eso lo decide
`elegirVendedor()` al momento de comprar). `cantidadTotal` es la suma de
stock de todos los vendedores.

## `POST /api/productos` 🔒

Registra un producto para el Vendedor autenticado (su `Vendedor_id` se
resuelve del token, no se manda desde el cliente - nadie puede registrar un
producto a nombre de otro vendedor).

### Cuerpo de la petición (JSON)

| Campo                  | Tipo   | Requerido |
|------------------------|--------|-----------|
| `Nombre_Producto`      | string | Sí        |
| `Precio`               | number | Sí        |
| `Cantidad_Disponible`  | number | Sí        |
| `Descripcion`          | string | No        |
| `Unidad_De_Venta`      | number | No        |
| `MInimo_De_Compra`     | string | No        |
| `Foto_Producto_URL`    | string | No        |

### Errores comunes

| Código | Causa                                                          |
|--------|-------------------------------------------------------------------|
| `400`  | Falta `Nombre_Producto`, `Precio` o `Cantidad_Disponible`         |
| `401`  | Falta el token, expiró, o es inválido                             |
| `403`  | La cuenta autenticada no tiene un perfil de Vendedor registrado   |

## `GET /api/mis-productos` 🔒

Devuelve **todos** los productos del Vendedor autenticado, incluyendo los
agotados (a diferencia de un futuro catálogo público, que solo mostraría
los que tienen stock). Es la "galería de venta" del vendedor.

**Respuesta (`200`):** arreglo de filas `Producto`.

## `GET /api/elegir-vendedor`

Endpoint de prueba (sin token todavía) para el algoritmo de selección de
vendedor: dado un producto, una cantidad, y un comprador, elige qué
Vendedor debería surtir la compra, combinando rotación (tiempo desde su
última venta), calificación, y un "choque de dificultad" que penaliza
emparejar a un comprador y un vendedor difíciles entre sí.

### Parámetros de query

| Parámetro     | Tipo   | Requerido |
|---------------|--------|-----------|
| `producto`    | string | Sí        |
| `cantidad`    | number | No (default 1) |
| `compradorId` | number | Sí        |

### Ejemplo

```
GET /api/elegir-vendedor?producto=Tomate&cantidad=5&compradorId=1
```

```json
{ "producto_id": "2", "vendedor_id": "2", "puntaje": "150.0" }
```

**`404`:** ningún vendedor tiene ese producto con suficiente stock.

## `POST /api/comprar` 🔒

Compra `cantidad` unidades de un producto para el Comprador autenticado.
Es el endpoint que ata todo el flujo:

1. `elegirVendedor()` decide qué Vendedor surte la compra (mismo algoritmo
   que `/api/elegir-vendedor`).
2. Descuenta el stock de ese `Producto` específico y actualiza
   `Ultima_Venta` del Vendedor (para que la próxima compra ya lo tome en
   cuenta en la rotación).
3. Si el Comprador no tiene todavía una cuenta en Nessie, se le crea una
   automáticamente (customer + cuenta Checking con $1000 de saldo inicial)
   la primera vez que compra algo.
4. Le hace un **withdrawal** real en Nessie por el monto total - así es
   como "se le resta el dinero" al comprador.
5. Crea un **Bill** real en Nessie como factura/recibo de la compra.

### Cuerpo de la petición (JSON)

| Campo             | Tipo   | Requerido |
|-------------------|--------|-----------|
| `Nombre_Producto`  | string | Sí        |
| `cantidad`         | number | Sí (> 0)  |

### Ejemplo de respuesta exitosa (`201`)

```json
{
  "producto": {
    "id": "3",
    "Nombre_Producto": "Aguacate",
    "cantidad": 1,
    "precioUnitario": 45,
    "total": 45
  },
  "retiro": {
    "_id": "4faa2545-ced1-4c9a-9203-55587a9fae2c",
    "amount": 45,
    "description": "Compra: Aguacate x1"
  },
  "factura": {
    "id": "3b15c0d7-4188-4601-85ef-149593b837df",
    "url": "/api/facturas/3b15c0d7-4188-4601-85ef-149593b837df"
  }
}
```

`factura.url` es una ruta relativa - añade la URL base del backend para
tener el link completo y compartible.

### Errores comunes

| Código | Causa                                                             |
|--------|----------------------------------------------------------------------|
| `400`  | Falta `Nombre_Producto` o `cantidad` no es un número positivo        |
| `401`  | Falta el token, expiró, o es inválido                                 |
| `403`  | La cuenta autenticada no tiene un perfil de Comprador registrado      |
| `404`  | Ningún vendedor tiene ese producto con stock suficiente                |
| `409`  | El stock cambió entre elegir el vendedor y confirmar la compra (carrera con otra compra simultánea) |

> ⚠️ **Limitación conocida:** el withdrawal y el bill en Nessie ocurren
> *después* de confirmar el descuento de stock en la base de datos. Si
> Nessie falla en ese punto, el stock ya se descontó y no hay una
> compensación automática. Aceptable para este stack de desarrollo, pero
> es lo primero a resolver antes de usar esto en producción.

## `GET /api/facturas/:id`

Página HTML pública (sin token) que muestra una factura creada por
`/api/comprar` - "viewable con un link" significa que cualquiera con la
URL puede verla, igual que la mayoría de los links de recibos reales.
Internamente llama a `nessie.get_bill_by_id()`.

**`404`:** no existe una factura con ese id en Nessie.

## Ejemplo: función de ayuda (`api.js`)

```javascript
// src/api.js
const BASE_URL = 'https://agrotecapi.saviorcode.com'

export async function llamarApi(ruta, { token, ...opciones } = {}) {
  const res = await fetch(`${BASE_URL}${ruta}`, {
    ...opciones,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...opciones.headers,
    },
  })

  const data = await res.json()

  if (!res.ok) {
    throw new Error(data.error || 'Error desconocido')
  }

  return data
}
```

## Ejemplo: registrar un producto (componente funcional)

```jsx
import { useState } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import { llamarApi } from './api'

export default function RegistrarProductoForm() {
  const { getAccessTokenSilently } = useAuth0()
  const [nombre, setNombre] = useState('')
  const [precio, setPrecio] = useState('')
  const [cantidad, setCantidad] = useState('')
  const [resultado, setResultado] = useState(null)
  const [error, setError] = useState(null)

  async function manejarEnvio(evento) {
    evento.preventDefault()
    setError(null)

    try {
      const token = await getAccessTokenSilently()
      const data = await llamarApi('/api/productos', {
        method: 'POST',
        token,
        body: JSON.stringify({
          Nombre_Producto: nombre,
          Precio: Number(precio),
          Cantidad_Disponible: Number(cantidad),
        }),
      })
      setResultado(data)
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <form onSubmit={manejarEnvio}>
      <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre" required />
      <input value={precio} onChange={(e) => setPrecio(e.target.value)} type="number" placeholder="Precio" required />
      <input value={cantidad} onChange={(e) => setCantidad(e.target.value)} type="number" placeholder="Cantidad" required />
      <button type="submit">Registrar</button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {resultado && <pre>{JSON.stringify(resultado, null, 2)}</pre>}
    </form>
  )
}
```

## Ejemplo: hook personalizado para un endpoint protegido

```javascript
// src/useApiProtegida.js
import { useState, useCallback } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import { llamarApi } from './api'

export function useApiProtegida() {
  const { getAccessTokenSilently } = useAuth0()
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState(null)

  const llamar = useCallback(async (ruta, opciones) => {
    setCargando(true)
    setError(null)
    try {
      const token = await getAccessTokenSilently()
      return await llamarApi(ruta, { ...opciones, token })
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setCargando(false)
    }
  }, [getAccessTokenSilently])

  return { llamar, cargando, error }
}
```

## Ejemplo: comprar un producto

```jsx
import { useState } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import { llamarApi } from './api'

export default function ComprarBoton({ nombreProducto, cantidad }) {
  const { getAccessTokenSilently } = useAuth0()
  const [resultado, setResultado] = useState(null)
  const [error, setError] = useState(null)
  const [comprando, setComprando] = useState(false)

  async function comprar() {
    setComprando(true)
    setError(null)
    try {
      const token = await getAccessTokenSilently()
      const data = await llamarApi('/api/comprar', {
        method: 'POST',
        token,
        body: JSON.stringify({ Nombre_Producto: nombreProducto, cantidad }),
      })
      setResultado(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setComprando(false)
    }
  }

  return (
    <div>
      <button onClick={comprar} disabled={comprando}>
        {comprando ? 'Comprando...' : `Comprar ${cantidad} ${nombreProducto}`}
      </button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {resultado && (
        <p>
          ¡Listo! Total: ${resultado.producto.total} -{' '}
          <a href={`https://agrotecapi.saviorcode.com${resultado.factura.url}`} target="_blank" rel="noreferrer">
            Ver factura
          </a>
        </p>
      )}
    </div>
  )
}
```

## CORS

El backend acepta peticiones cross-origin desde:

- `https://agrotec.saviorcode.com` (producción)
- `http://localhost:5173` (Vite en desarrollo local)

Si corres el frontend en otro origen, avisa para agregarlo a la lista de
`origin` en `src/src/app.js`.

## Página de prueba sin React

Este proyecto también incluye una página HTML simple para probar
`/api/register` sin necesidad de un frontend completo: abre
`http://localhost:3000/api/test` con el stack corriendo (requiere el
puerto local publicado en `docker-compose.yml`).
