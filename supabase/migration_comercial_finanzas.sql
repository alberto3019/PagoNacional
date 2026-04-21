-- Ejecutar en Supabase SQL Editor si la base ya existía antes de esta funcionalidad.
-- Comerciales, finanzas globales y asignación por camionero.

CREATE TABLE IF NOT EXISTS comerciales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  apellido TEXT NOT NULL,
  porcentaje_comision NUMERIC(6, 2) NOT NULL DEFAULT 0
    CHECK (porcentaje_comision >= 0 AND porcentaje_comision <= 100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS finanzas_config (
  id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  comision_pagonacional_pct NUMERIC(6, 2) NOT NULL DEFAULT 10
    CHECK (comision_pagonacional_pct >= 0 AND comision_pagonacional_pct <= 100),
  gasto_administrativo NUMERIC(14, 2) NOT NULL DEFAULT 0
    CHECK (gasto_administrativo >= 0),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO finanzas_config (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

ALTER TABLE camioneros ADD COLUMN IF NOT EXISTS comercial_id UUID REFERENCES comerciales(id) ON DELETE SET NULL;

ALTER TABLE comerciales ENABLE ROW LEVEL SECURITY;
ALTER TABLE finanzas_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS anon_comerciales_all ON comerciales;
CREATE POLICY anon_comerciales_all
  ON comerciales FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS anon_finanzas_config_all ON finanzas_config;
CREATE POLICY anon_finanzas_config_all
  ON finanzas_config FOR ALL TO anon USING (true) WITH CHECK (true);
