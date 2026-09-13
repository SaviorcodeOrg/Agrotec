-- Schema for the actual Agrotec app tables (Usuario/Vendedor/Comprador/
-- Producto). This did NOT exist as a migration anywhere in the repo - the
-- real schema was apparently created by hand through Studio's SQL editor on
-- another machine (see README's "Migrating your existing WSL Postgres
-- data" section) and never captured here. This is a reconstruction from
-- every query in src/src/*.js (registerUsuario.js, productos.js,
-- comprar.js, elegirVendedor.js) plus the one saved migration snippet in
-- studio-snippets/ - good enough for the app's own queries to work on a
-- fresh dev database, but NOT guaranteed to match the original's exact
-- types/constraints/defaults. If a real pg_dump of the original shows up,
-- restore that instead and delete this file.
--
-- Only runs on a brand-new (empty) Postgres data volume, same as
-- 01-api-roles.sql.

CREATE TABLE IF NOT EXISTS "Vendedor" (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    "Nombre" text NOT NULL,
    "Apellidos" text,
    "Nombre_Negocio" text,
    "Identificacion_URL" text,
    "Foto_URL" text,
    "Ubicaion_Aproximada" text,
    "Ultima_Venta" timestamptz,
    "Calificacion" numeric,
    "Dificultad" numeric NOT NULL DEFAULT 0,
    "NessieCustomerId" text,
    "NessieAccountId" text
);

CREATE TABLE IF NOT EXISTS "Comprador" (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    "Nombre" text NOT NULL,
    "Apellidos" text,
    "Identificacion_URL" text,
    "Foto_URL" text,
    "A_Quien_Compro" text,
    "Fecha" date,
    "Modalidad_De_Entrega" text,
    "Dificultad" numeric NOT NULL DEFAULT 0,
    "NessieCustomerId" text,
    "NessieAccountId" text
);

-- id_Vendedor/ID_comprador are plain nullable FKs (not identity columns -
-- see studio-snippets/Untitled query 227.sql, which drops IDENTITY/NOT NULL
-- that an earlier version of this table apparently had by mistake).
CREATE TABLE IF NOT EXISTS "Usuario" (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    "id_Vendedor" bigint REFERENCES "Vendedor"(id) ON DELETE SET NULL,
    "ID_comprador" bigint REFERENCES "Comprador"(id) ON DELETE SET NULL,
    "Username" text NOT NULL UNIQUE,
    "Nombre" text,
    "Email" text,
    "Telefono" text,
    "Auth0Sub" text NOT NULL UNIQUE,
    "id_activo" bigint GENERATED ALWAYS AS (COALESCE("id_Vendedor", "ID_comprador")) STORED,
    CONSTRAINT chk_solo_un_tipo_usuario CHECK (
        ("id_Vendedor" IS NOT NULL AND "ID_comprador" IS NULL) OR
        ("id_Vendedor" IS NULL AND "ID_comprador" IS NOT NULL)
    )
);

CREATE TABLE IF NOT EXISTS "Producto" (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    "Vendedor_id" bigint NOT NULL REFERENCES "Vendedor"(id) ON DELETE CASCADE,
    "Nombre_Producto" text NOT NULL,
    "Precio" numeric NOT NULL,
    "Cantidad_Disponible" integer NOT NULL DEFAULT 0,
    "Descripcion" text,
    "Unidad_De_Venta" numeric,
    "MInimo_De_Compra" text,
    "Foto_Producto_URL" text
);

CREATE INDEX IF NOT EXISTS idx_producto_nombre ON "Producto" ("Nombre_Producto");
CREATE INDEX IF NOT EXISTS idx_producto_vendedor ON "Producto" ("Vendedor_id");

GRANT SELECT, INSERT, UPDATE, DELETE ON "Vendedor", "Comprador", "Usuario", "Producto"
    TO service_role;
