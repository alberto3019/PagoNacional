-- Domicilio del camionero (perfil) y firma digital en cada solicitud.
-- Ejecutar en el SQL Editor de Supabase si la base ya existía sin estas columnas.

ALTER TABLE camioneros ADD COLUMN IF NOT EXISTS domicilio TEXT;

ALTER TABLE solicitudes ADD COLUMN IF NOT EXISTS firma_url TEXT;

ALTER TABLE solicitudes ADD COLUMN IF NOT EXISTS domicilio_declarado TEXT;
