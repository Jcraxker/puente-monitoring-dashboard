-- ============================================
-- Migration 007: vincular login con personal de campo
-- Un login actua como UNA persona (gestor/tecnico).
-- UNIQUE permite multiples NULL (monitor/encargado sin vinculo).
-- ============================================

ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS personal_id INTEGER REFERENCES personal(id);

DROP INDEX IF EXISTS uq_usuarios_personal;
CREATE UNIQUE INDEX uq_usuarios_personal ON usuarios (personal_id);
