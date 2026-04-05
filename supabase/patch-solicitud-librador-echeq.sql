-- Librador del echeq: va en la solicitud (datos del echeq), no en cuentas_destino del admin.
-- Admin solo usa CUIT en cuentas destino.

ALTER TABLE solicitudes ADD COLUMN IF NOT EXISTS librador TEXT;

-- Opcional: si antes cargaste librador en cuentas_destino, podés borrar la columna.
-- ALTER TABLE cuentas_destino DROP COLUMN IF EXISTS librador;
