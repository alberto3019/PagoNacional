-- Cuentas destino del admin: solo CUIT (asignación por CUIT).
-- El librador del echeq está en solicitudes.librador (ver patch-solicitud-librador-echeq.sql).

ALTER TABLE cuentas_destino ADD COLUMN IF NOT EXISTS cuit TEXT;
ALTER TABLE solicitudes ADD COLUMN IF NOT EXISTS cuenta_destino_cuit TEXT;
ALTER TABLE solicitudes ADD COLUMN IF NOT EXISTS cuenta_destino_librador TEXT;
