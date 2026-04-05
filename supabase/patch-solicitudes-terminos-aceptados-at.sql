-- Parche idempotente para tabla solicitudes (Supabase → SQL Editor).
-- Si aparece "Could not find the 'terminos_html' / 'terminos_aceptados_at' / … column"
-- en la solicitud o en el admin, ejecutá este script completo.

ALTER TABLE solicitudes ADD COLUMN IF NOT EXISTS cuenta_destino_id UUID;
ALTER TABLE solicitudes ADD COLUMN IF NOT EXISTS cuenta_destino_alias TEXT;
ALTER TABLE solicitudes ADD COLUMN IF NOT EXISTS cuenta_destino_titular TEXT;
ALTER TABLE solicitudes ADD COLUMN IF NOT EXISTS cuenta_destino_cvu TEXT;
ALTER TABLE solicitudes ADD COLUMN IF NOT EXISTS cuenta_destino_cuit TEXT;
ALTER TABLE solicitudes ADD COLUMN IF NOT EXISTS cuenta_destino_librador TEXT;
ALTER TABLE solicitudes ADD COLUMN IF NOT EXISTS cuenta_destino_banco TEXT;
ALTER TABLE solicitudes ADD COLUMN IF NOT EXISTS terminos_html TEXT;
ALTER TABLE solicitudes ADD COLUMN IF NOT EXISTS terminos_aceptados_at TIMESTAMPTZ;
