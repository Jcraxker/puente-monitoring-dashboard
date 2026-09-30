-- ============================================
-- Migration 003: costo_transporte + sync_estado
-- Viaticos come from KoBo "Costo de Transporte"
-- (group_mx7uy35/Costo_de_Transporte, "Total
-- Quetzales gastado en el dia"). sync_estado
-- stores last_sync for incremental sync.
-- ============================================

ALTER TABLE actividades
  ADD COLUMN IF NOT EXISTS costo_transporte DECIMAL(10,2) DEFAULT 0;

CREATE TABLE IF NOT EXISTS sync_estado (
    id SERIAL PRIMARY KEY,
    clave VARCHAR(50) NOT NULL UNIQUE,
    valor TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO sync_estado (clave, valor) VALUES ('last_sync', NULL)
ON CONFLICT (clave) DO NOTHING;
