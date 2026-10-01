-- ============================================
-- Migration 005: correlativos
-- Folios secuenciales por serie (ej. PV-202609).
-- ============================================

CREATE TABLE IF NOT EXISTS correlativos (
    serie VARCHAR(20) PRIMARY KEY,
    ultimo INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
