-- Si al enviar una solicitud aparece:
-- "Could not find the 'terminos_aceptados_at' column of 'solicitudes' in the schema cache"
-- ejecutá esto en Supabase → SQL Editor (es idempotente).

ALTER TABLE solicitudes ADD COLUMN IF NOT EXISTS terminos_aceptados_at TIMESTAMPTZ;
