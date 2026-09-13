# Referencia: módulo `nessieisreal.js`

Documentación de `src/src/nessieisreal.js`, el wrapper interno sobre la API
pública de [Nessie](http://api.nessieisreal.com/) (Capital One). No es un
endpoint HTTP de este backend - es un módulo de JavaScript que otros
archivos del backend importan directamente (`import nessie from
'./nessieisreal.js'`) para hablar con Nessie.

## Configuración

Requiere la variable de entorno `NESSIE_KEY` (ver `src/.env`). Todas las
peticiones se mandan a `https://api.nessieisreal.com` con `?key=<NESSIE_KEY>`
agregado a la URL.

> **Nota:** la documentación oficial actual ([nessieisreal.com/docs](https://nessieisreal.com/docs))
> lista el servidor como `https://prod-api.nessieisreal.com`, no
> `api.nessieisreal.com`. En la práctica `api.nessieisreal.com` sigue
> funcionando (confirmado con llamadas reales durante esta sesión - creación
> de customers y merchants exitosa), probablemente un dominio anterior que
> todavía redirige/sirve el mismo backend. Si algún día deja de responder,
> ese es el primer lugar a revisar.

```javascript
import nessie from './nessieisreal.js'

const clientes = await nessie.get_customers()
```

## ⚠️ Importante: todos los métodos devuelven texto, no JSON

Cada método de `nessie` regresa lo que sea que devuelva `web.get` /
`web.post` / `web.put` / `web.delete` (ver `src/src/webconnections.js`), y
esas cuatro funciones siempre hacen `response.text()` - **nunca**
`response.json()`. Esto significa:

```javascript
const resultado = await nessie.create_customer()
// resultado es un STRING como '{"code":201,"message":"Customer created",...}',
// no un objeto. Si necesitas los campos, tienes que parsearlo tú mismo:
const datos = JSON.parse(resultado)
```

Esto ya causó un bug real: `api.get('/getusers', ...)` en `app.js` hace
`` res.send(`${await nessie.create_customer()}`) `` - funciona porque
interpola un string dentro de un string, pero si necesitas leer un campo
específico de la respuesta vas a necesitar `JSON.parse()` primero. Ninguno
de los métodos abajo hace ese parseo por ti.

También cada llamada hace `console.log` del `STATUS`, `CONTENT-TYPE`, y el
cuerpo completo de la respuesta - útil para depurar, pero espera ver eso en
los logs del contenedor `app` cada vez que se usa cualquier método de
`nessie`.

## Capa base: `web` (`webconnections.js`)

`nessieisreal.js` no llama a `fetch` directamente - usa estos cuatro
métodos de bajo nivel:

| Método             | Verbo HTTP | Notas                                                |
|---------------------|-----------|-------------------------------------------------------|
| `web.get(address)`  | GET       | Sin body.                                              |
| `web.post(address, body)` | POST | Manda `body` como JSON (`Content-Type: application/json`). |
| `web.put(address, body)`  | PUT  | Igual que POST pero con verbo PUT.                    |
| `web.delete(address)`     | DELETE | Sin body.                                            |

## Customers

| Método | Verbo + ruta | Parámetros | Descripción |
|---|---|---|---|
| `get_customers()` | `GET /customers` | — | Todos los customers del API key actual. |
| `create_customer(customer?)` | `POST /customers` | `customer` (opcional - hay un default con datos de ejemplo) | Crea un customer. |
| `get_customer_by_id(id)` | `GET /customers/:id` | `id` | Un customer por id. |
| `update_customer(id, customer)` | `PUT /customers/:id` | `id`, `customer` | Actualiza un customer. |
| `get_customer_for_account(accountId)` | `GET /accounts/:id/customer` | `accountId` | El customer dueño de una cuenta. |

## Accounts

| Método | Verbo + ruta | Parámetros | Descripción |
|---|---|---|---|
| `get_accounts_for_customer(customerId)` | `GET /customers/:id/accounts` | `customerId` | Cuentas de un customer. |
| `create_account_for_customer(customerId, account)` | `POST /customers/:id/accounts` | `customerId`, `account` | Crea una cuenta para un customer. |
| `get_accounts()` | `GET /accounts` | — | Todas las cuentas. |
| `get_account_by_id(id)` | `GET /accounts/:id` | `id` | Una cuenta por id. |
| `update_account(id, account)` | `PUT /accounts/:id` | `id`, `account` | Actualiza una cuenta. |
| `delete_account(id)` | `DELETE /accounts/:id` | `id` | Elimina una cuenta. |

## Deposits

| Método | Verbo + ruta | Parámetros | Descripción |
|---|---|---|---|
| `get_deposits_for_account(accountId)` | `GET /accounts/:id/deposits` | `accountId` | Depósitos de una cuenta. |
| `create_deposit_for_account(accountId, deposit)` | `POST /accounts/:id/deposits` | `accountId`, `deposit` | Crea un depósito. |
| `get_deposits()` | `GET /deposits` | — | Todos los depósitos. |
| `get_deposit_by_id(id)` | `GET /deposits/:id` | `id` | Un depósito por id. |
| `update_deposit(id, deposit)` | `PUT /deposits/:id` | `id`, `deposit` | Actualiza un depósito. |
| `delete_deposit(id)` | `DELETE /deposits/:id` | `id` | Elimina un depósito. |

## Withdrawals

| Método | Verbo + ruta | Parámetros | Descripción |
|---|---|---|---|
| `get_withdrawal_by_id(withdrawalId)` | `GET /withdrawal/:id` | `withdrawalId` | Un retiro por id. |
| `update_withdrawal(withdrawalId, withdrawal)` | `PUT /withdrawal/:id` | `withdrawalId`, `withdrawal` | Actualiza un retiro. |
| `delete_withdrawal(withdrawalId)` | `DELETE /withdrawal/:id` | `withdrawalId` | Elimina un retiro. |
| `get_withdrawals_for_account(accountId)` | `GET /accounts/:id/withdrawals` | `accountId` | Retiros de una cuenta. |
| `create_withdrawal_for_account(accountId, withdrawal)` | `POST /accounts/:id/withdrawals` | `accountId`, `withdrawal` | Crea un retiro. |

> Nota: la ruta de Nessie es `/withdrawal` (singular), a diferencia de
> `/deposits`/`/accounts` (plural) - así lo documenta la API real, no es un
> error de este wrapper.

## Transfers

| Método | Verbo + ruta | Parámetros | Descripción |
|---|---|---|---|
| `get_transfer_by_id(transferId)` | `GET /transfers/:id` | `transferId` | Una transferencia por id. |
| `update_transfer(transferId, transfer)` | `PUT /transfers/:id` | `transferId`, `transfer` | Actualiza una transferencia. |
| `delete_transfer(transferId)` | `DELETE /transfers/:id` | `transferId` | Elimina una transferencia. |

No hay `create_transfer` ni `get_transfers_for_account` todavía. Se probó
implementar `create_transfer_for_account`, pero el `TransferCreate` de este
sandbox es estricto y no acepta ningún campo para indicar la cuenta
destino (se probaron `medium` y `payee_id`, ambos rechazados como "extra
fields not permitted"; los únicos campos que acepta son `transaction_date`,
`status`, `amount` y `description`) - no sirve para mover dinero entre dos
cuentas propias tal cual.

Nota aparte: `Withdrawal`/`Deposit` también truncan `amount` a dólares
enteros server-side (probado: enviar 7.55 devuelve `"amount": 7`), a
diferencia de `Bill.payment_amount`, que sí guarda decimales reales.

## Purchases

| Método | Verbo + ruta | Parámetros | Descripción |
|---|---|---|---|
| `get_purchase_by_id(purchaseId)` | `GET /purchase/:id` | `purchaseId` | Una compra por id. |
| `update_purchase(purchaseId, purchase)` | `PUT /purchase/:id` | `purchaseId`, `purchase` | Actualiza una compra. |
| `delete_purchase(purchaseId)` | `DELETE /purchase/:id` | `purchaseId` | Elimina una compra. |

> Igual que Withdrawals: la ruta es `/purchase` (singular). No hay
> `create_purchase` ni `get_purchases_for_account` implementados todavía.

## Loans

| Método | Verbo + ruta | Parámetros | Descripción |
|---|---|---|---|
| `get_loans_for_account(accountId)` | `GET /accounts/:id/loans` | `accountId` | Préstamos de una cuenta. |
| `create_loan_for_account(accountId, loan)` | `POST /accounts/:id/loans` | `accountId`, `loan` | Crea un préstamo. |
| `get_loan_by_id(id)` | `GET /loans/:id` | `id` | Un préstamo por id. |
| `update_loan(id, loan)` | `PUT /loans/:id` | `id`, `loan` | Actualiza un préstamo. |
| `delete_loan(id)` | `DELETE /loans/:id` | `id` | Elimina un préstamo. |

## Bills

| Método | Verbo + ruta | Parámetros | Descripción |
|---|---|---|---|
| `get_bills_for_customer(customerId)` | `GET /customers/:id/bills` | `customerId` | Bills de un customer. |
| `get_bills_for_account(accountId)` | `GET /accounts/:id/bills` | `accountId` | Bills de una cuenta. |
| `create_bill_for_account(accountId, bill)` | `POST /accounts/:id/bills` | `accountId`, `bill` | Crea un bill. |
| `get_bill_by_id(billId)` | `GET /bills/:id` | `billId` | Un bill por id. |
| `update_bill(billId, bill)` | `PUT /bills/:id` | `billId`, `bill` | Actualiza un bill. |
| `delete_bill(billId)` | `DELETE /bills/:id` | `billId` | Elimina un bill. |

## Merchants

| Método | Verbo + ruta | Parámetros | Descripción |
|---|---|---|---|
| `get_merchants()` | `GET /merchants` | — | Todos los merchants. |
| `create_merchant(merchant)` | `POST /merchants` | `merchant` | Crea un merchant. Usado por `POST /api/register` cuando `vendedor: true`. |
| `get_merchant_by_id(id)` | `GET /merchants/:id` | `id` | Un merchant por id. |
| `update_merchant(id, merchant)` | `PUT /merchants/:id` | `id`, `merchant` | Actualiza un merchant. |

No hay `delete_merchant` implementado.

**Forma esperada de `merchant`** (ver el uso real en `app.js`):

```javascript
{
  name: "Rancho El Carmen",
  category: "general",       // string, NO array - la API rechaza un array
  address: {
    street_number: "0",
    street_name: "Saltillo, COAH",
    city: "NA",
    state: "NA",              // máximo 2 caracteres, si no la API lo rechaza
    zip: "00000"
  }
}
```

## ATMs

| Método | Verbo + ruta | Parámetros | Descripción |
|---|---|---|---|
| `get_atms()` | `GET /atms` | — | Todos los ATMs. |
| `get_atm_by_id(id)` | `GET /atms/:id` | `id` | Un ATM por id. |

Solo lectura - la API de Nessie no soporta crear/editar/eliminar ATMs
manualmente, así que este wrapper tampoco.

## Branches

| Método | Verbo + ruta | Parámetros | Descripción |
|---|---|---|---|
| `get_branches()` | `GET /branches` | — | Todas las sucursales. |
| `get_branch_by_id(id)` | `GET /branches/:id` | `id` | Una sucursal por id. |

Igual que ATMs: solo lectura.

## Enterprise (no implementado)

La API real tiene una categoría adicional que este wrapper no cubre en
absoluto - operaciones de solo lectura a nivel "empresa" (probablemente
pensadas para un dashboard interno, no para una app de cliente final):

| Verbo + ruta | Descripción |
|---|---|
| `GET /enterprise/customers` | Todos los customers (vista enterprise). |
| `GET /enterprise/customers/:id` | Un customer por id (vista enterprise). |
| `GET /enterprise/deposits` | Todos los depósitos (vista enterprise). |
| `GET /enterprise/deposits/:id` | Un depósito por id (vista enterprise). |
| `GET /enterprise/withdrawal/:id` | Un retiro por id (vista enterprise). |

No hay evidencia de que esta app los necesite - se documentan aquí solo
para que quede registro de que existen, por si en el futuro hace falta
alguna vista administrativa.

## Dónde se usa esto hoy

- `POST /api/register` llama a `nessie.create_merchant()` cuando
  `vendedor: true` (ver `src/dist/react-api.md`).
- `GET /api/getusers` llama a `nessie.create_customer()` como ruta de
  prueba - no está pensada para producción.

El resto de los ~30 métodos de este módulo están implementados pero
todavía no están conectados a ningún endpoint HTTP de este backend.
