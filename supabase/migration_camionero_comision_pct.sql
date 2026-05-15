-- Comisión personalizada por camionero (opcional; anula el % del comercial o Pago Nacional).
ALTER TABLE camioneros ADD COLUMN IF NOT EXISTS comision_pct NUMERIC(6, 2)
  CHECK (comision_pct IS NULL OR (comision_pct >= 0 AND comision_pct <= 100));
