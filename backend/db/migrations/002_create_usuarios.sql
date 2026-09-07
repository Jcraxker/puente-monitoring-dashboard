-- ============================================
-- Migration 002: usuarios table
-- Dashboard de Monitoreo de Actividades
-- Fundacion Puente Guatemala
-- ============================================
-- Login accounts are a subset of field staff: everyone
-- reporting in KoBo exists in personal, but only current
-- staff gets a login. Departed staff is flagged
-- activo = FALSE instead of deleted (keeps history).
-- Password hashes come from environment (.env), never
-- committed. See .env.example for variable names.
-- ============================================

-- ============================================
-- TABLE: usuarios
-- Login accounts with role-based access.
-- FK: departamento (where they work).
-- ============================================
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    nombre VARCHAR(150) NOT NULL,
    rol VARCHAR(50) NOT NULL,
    departamento_id INTEGER REFERENCES departamentos(id),
    password_hash VARCHAR(255) NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_usuarios_username ON usuarios(username);
CREATE INDEX idx_usuarios_departamento ON usuarios(departamento_id);
