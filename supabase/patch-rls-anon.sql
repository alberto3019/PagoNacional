-- ============================================================
-- Parche: si ya ejecutaste un schema.sql viejo (solo service_role),
-- corré ESTE script en Supabase → SQL Editor para que la web
-- pueda leer/escribir con la clave anon del .env.
-- Es idempotente (podés re-ejecutarlo).
-- ============================================================

ALTER TABLE solicitudes ADD COLUMN IF NOT EXISTS cuenta_destino_id UUID;
ALTER TABLE solicitudes ADD COLUMN IF NOT EXISTS cuenta_destino_alias TEXT;
ALTER TABLE solicitudes ADD COLUMN IF NOT EXISTS cuenta_destino_titular TEXT;
ALTER TABLE solicitudes ADD COLUMN IF NOT EXISTS cuenta_destino_cvu TEXT;
ALTER TABLE solicitudes ADD COLUMN IF NOT EXISTS cuenta_destino_banco TEXT;
ALTER TABLE solicitudes ADD COLUMN IF NOT EXISTS terminos_html TEXT;
ALTER TABLE solicitudes ADD COLUMN IF NOT EXISTS terminos_aceptados_at TIMESTAMPTZ;
ALTER TABLE solicitudes ADD COLUMN IF NOT EXISTS cuenta_destino_cuit TEXT;
ALTER TABLE solicitudes ADD COLUMN IF NOT EXISTS cuenta_destino_librador TEXT;

CREATE TABLE IF NOT EXISTS prestamista_config (
  id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  razon_social TEXT DEFAULT '',
  cuit TEXT DEFAULT '',
  domicilio TEXT DEFAULT '',
  email_legal TEXT DEFAULT '',
  telefono TEXT DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO prestamista_config (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

ALTER TABLE prestamista_config ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS cuentas_destino (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alias TEXT NOT NULL,
  titular TEXT NOT NULL,
  cuit TEXT,
  librador TEXT,
  banco TEXT,
  activa BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE cuentas_destino ADD COLUMN IF NOT EXISTS cuit TEXT;
ALTER TABLE cuentas_destino ADD COLUMN IF NOT EXISTS librador TEXT;

ALTER TABLE cuentas_destino ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role full access camioneros" ON camioneros;
DROP POLICY IF EXISTS "service_role full access solicitudes" ON solicitudes;

DROP POLICY IF EXISTS anon_camioneros_all ON camioneros;
DROP POLICY IF EXISTS anon_solicitudes_all ON solicitudes;
DROP POLICY IF EXISTS anon_cuentas_destino_all ON cuentas_destino;
DROP POLICY IF EXISTS anon_prestamista_config_all ON prestamista_config;

CREATE POLICY anon_camioneros_all
  ON camioneros FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY anon_solicitudes_all
  ON solicitudes FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY anon_cuentas_destino_all
  ON cuentas_destino FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY anon_prestamista_config_all
  ON prestamista_config FOR ALL TO anon USING (true) WITH CHECK (true);
