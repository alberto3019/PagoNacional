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

-- Row Level Security
ALTER TABLE camioneros ENABLE ROW LEVEL SECURITY;
ALTER TABLE solicitudes ENABLE ROW LEVEL SECURITY;

-- Politicas: solo el service_role (backend) puede leer/escribir todo
CREATE POLICY "service_role full access camioneros"
  ON camioneros FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "service_role full access solicitudes"
  ON solicitudes FOR ALL USING (auth.role() = 'service_role');

-- Columnas opcionales en solicitudes (aprobación / cuenta destino). Ejecutar si faltan:
-- ALTER TABLE solicitudes ADD COLUMN IF NOT EXISTS cuenta_destino_id UUID;
-- ALTER TABLE solicitudes ADD COLUMN IF NOT EXISTS cuenta_destino_alias TEXT;
-- ALTER TABLE solicitudes ADD COLUMN IF NOT EXISTS cuenta_destino_titular TEXT;
-- ALTER TABLE solicitudes ADD COLUMN IF NOT EXISTS cuenta_destino_cvu TEXT;
-- ALTER TABLE solicitudes ADD COLUMN IF NOT EXISTS cuenta_destino_banco TEXT;

-- Storage bucket para imagenes DNI
INSERT INTO storage.buckets (id, name, public)
  VALUES ('dni-fotos', 'dni-fotos', false);
