-- 1. Quitar la propiedad de columna Identitaria/Autoincremental
ALTER TABLE public."Usuario" 
  ALTER COLUMN "id_Vendedor" DROP IDENTITY IF EXISTS,
  ALTER COLUMN "ID_comprador" DROP IDENTITY IF EXISTS;

-- 2. Permitir que ambas columnas acepten valores vacíos (NULL)
ALTER TABLE public."Usuario" 
  ALTER COLUMN "id_Vendedor" DROP NOT NULL,
  ALTER COLUMN "ID_comprador" DROP NOT NULL;

-- 3. Corregir el tipo de dato de Teléfono (de entero a texto)
ALTER TABLE public."Usuario" 
  ALTER COLUMN "Telefono" TYPE text USING "Telefono"::text;

-- 4. Crear las Llaves Foráneas (Foreign Keys) hacia Vendedor y Comprador
ALTER TABLE public."Usuario"
  ADD CONSTRAINT fk_usuario_vendedor 
    FOREIGN KEY ("id_Vendedor") REFERENCES public."Vendedor"(id) ON DELETE SET NULL,
  ADD CONSTRAINT fk_usuario_comprador 
    FOREIGN KEY ("ID_comprador") REFERENCES public."Comprador"(id) ON DELETE SET NULL;

-- 5. Agregar la restricción CHECK (Solo uno de los dos debe tener valor)
ALTER TABLE public."Usuario"
  ADD CONSTRAINT chk_solo_un_tipo_usuario 
    CHECK (
      ("id_Vendedor" IS NOT NULL AND "ID_comprador" IS NULL) OR
      ("id_Vendedor" IS NULL AND "ID_comprador" IS NOT NULL)
    );

-- 6. Crear la columna calculada que toma el ID activo automáticamente
ALTER TABLE public."Usuario"
  ADD COLUMN id_activo int8 GENERATED ALWAYS AS (COALESCE("id_Vendedor", "ID_comprador")) STORED;