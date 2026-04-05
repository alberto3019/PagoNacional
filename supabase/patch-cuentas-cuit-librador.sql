-- Cuentas destino del admin: CUIT + librador (asignación de echeq), en lugar de CBU/CVU.
-- Ejecutar en Supabase → SQL Editor si la app espera columnas cuit/librador y falla.

ALTER TABLE cuentas_destino ADD COLUMN IF NOT EXISTS cuit TEXT;
ALTER TABLE cuentas_destino ADD COLUMN IF NOT EXISTS librador TEXT;
ALTER TABLE solicitudes ADD COLUMN IF NOT EXISTS cuenta_destino_cuit TEXT;
ALTER TABLE solicitudes ADD COLUMN IF NOT EXISTS cuenta_destino_librador TEXT;
