-- ============================================
-- Migration 006: normalizar + deduplicar comunidades
-- Limpia guiones bajos y elimina duplicados
-- (el sync re-insertaba todo: no habia UNIQUE).
-- ============================================

UPDATE comunidades
SET nombre = regexp_replace(trim(BOTH FROM replace(nombre, '_', ' ')), '\s+', ' ', 'g');

DELETE FROM comunidades a
USING comunidades b
WHERE a.id > b.id
  AND a.nombre = b.nombre
  AND a.departamento_id IS NOT DISTINCT FROM b.departamento_id;

ALTER TABLE comunidades
  ADD CONSTRAINT uq_comunidades_nombre_depto UNIQUE (nombre, departamento_id);
