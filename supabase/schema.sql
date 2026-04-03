-- ============================================================
-- PAGO NACIONAL - Schema de base de datos
-- Ejecutar en el SQL Editor de Supabase
-- ============================================================

-- Tabla de camioneros (usuarios)
CREATE TABLE camioneros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  apellido TEXT NOT NULL,
  dni TEXT NOT NULL UNIQUE,
  cuit TEXT NOT NULL UNIQUE,
  celular TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  email_verificado BOOLEAN DEFAULT FALSE,
  dni_frente_url TEXT,
  dni_dorso_url TEXT,
  cbu_cvu TEXT,
  password TEXT,
  password_reset_token TEXT,
  password_reset_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Si la tabla camioneros ya existía sin estas columnas, ejecutá:
-- ALTER TABLE camioneros ADD COLUMN IF NOT EXISTS dni_frente_url TEXT;
-- ALTER TABLE camioneros ADD COLUMN IF NOT EXISTS dni_dorso_url TEXT;
-- ALTER TABLE camioneros ADD COLUMN IF NOT EXISTS password TEXT;
-- ALTER TABLE camioneros ADD COLUMN IF NOT EXISTS password_reset_token TEXT;
-- ALTER TABLE camioneros ADD COLUMN IF NOT EXISTS password_reset_expires_at TIMESTAMPTZ;
-- ALTER TABLE camioneros ADD COLUMN IF NOT EXISTS cbu_cvu TEXT;

-- Tabla de solicitudes de echeq
CREATE TABLE solicitudes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero TEXT UNIQUE NOT NULL,
  camionero_id UUID NOT NULL REFERENCES camioneros(id) ON DELETE CASCADE,
  cbu_cvu TEXT NOT NULL,
  numero_echeq TEXT NOT NULL,
  monto NUMERIC(12, 2) NOT NULL,
  banco_emisor TEXT NOT NULL,
  fecha_vencimiento DATE NOT NULL,
  dni_frente_url TEXT,
  dni_dorso_url TEXT,
  estado TEXT NOT NULL DEFAULT 'pendiente'
    CHECK (estado IN ('pendiente', 'aprobado', 'rechazado')),
  tc_aceptado BOOLEAN NOT NULL DEFAULT FALSE,
  cuenta_destino_id UUID,
  cuenta_destino_alias TEXT,
  cuenta_destino_titular TEXT,
  cuenta_destino_cvu TEXT,
  cuenta_destino_banco TEXT,
  terminos_html TEXT,
  terminos_aceptados_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Funcion para generar numero de solicitud automatico
CREATE OR REPLACE FUNCTION generar_numero_solicitud()
RETURNS TRIGGER AS $$
DECLARE
  anio TEXT;
  seq INT;
BEGIN
  anio := TO_CHAR(NOW(), 'YYYY');
  SELECT COUNT(*) + 1 INTO seq FROM solicitudes
    WHERE TO_CHAR(created_at, 'YYYY') = anio;
  NEW.numero := 'PN-' || anio || '-' || LPAD(seq::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_numero_solicitud
  BEFORE INSERT ON solicitudes
  FOR EACH ROW EXECUTE FUNCTION generar_numero_solicitud();

-- Funcion para updated_at automatico
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_updated_at
  BEFORE UPDATE ON solicitudes
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Cuentas destino (acreditación; panel admin)
CREATE TABLE cuentas_destino (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alias TEXT NOT NULL,
  titular TEXT NOT NULL,
  cbu TEXT,
  cvu TEXT,
  banco TEXT,
  activa BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Datos legales del prestamista (panel admin → pestaña Términos); una sola fila id = 1
CREATE TABLE prestamista_config (
  id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  razon_social TEXT DEFAULT '',
  cuit TEXT DEFAULT '',
  domicilio TEXT DEFAULT '',
  email_legal TEXT DEFAULT '',
  telefono TEXT DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO prestamista_config (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- Row Level Security
ALTER TABLE camioneros ENABLE ROW LEVEL SECURITY;
ALTER TABLE solicitudes ENABLE ROW LEVEL SECURITY;
ALTER TABLE cuentas_destino ENABLE ROW LEVEL SECURITY;
ALTER TABLE prestamista_config ENABLE ROW LEVEL SECURITY;

-- La SPA usa la clave "anon" en el navegador (VITE_SUPABASE_ANON_KEY).
-- Sin políticas para el rol anon, Postgres bloquea SELECT/INSERT/UPDATE.
-- La anon key es pública (va en el bundle): cualquiera puede pegarle a la API de Supabase.
-- Evolución recomendada: Supabase Auth + RLS por usuario, o backend/Edge Functions con service_role.
CREATE POLICY anon_camioneros_all
  ON camioneros FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY anon_solicitudes_all
  ON solicitudes FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY anon_cuentas_destino_all
  ON cuentas_destino FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY anon_prestamista_config_all
  ON prestamista_config FOR ALL TO anon USING (true) WITH CHECK (true);

-- Storage bucket para imagenes DNI (ignorar si ya existe)
INSERT INTO storage.buckets (id, name, public)
  VALUES ('dni-fotos', 'dni-fotos', false)
  ON CONFLICT (id) DO NOTHING;
