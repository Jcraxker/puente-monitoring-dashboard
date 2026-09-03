-- ============================================
-- Migration 001: initial schema
-- Dashboard de Monitoreo de Actividades
-- Fundacion Puente Guatemala
-- ============================================
-- Based on archivos_puente/memoria/21_esquema_postgresql.sql,
-- adapted to separate tables: actividades (Laboral branch)
-- and permisos (Permiso branch) instead of a discriminator column.
-- ============================================

-- ============================================
-- TABLE: departamentos
-- Departments where Puente works (PQL, CAH)
-- ============================================
CREATE TABLE departamentos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    codigo VARCHAR(10) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO departamentos (nombre, codigo) VALUES
('Chimaltenango', 'PQL'),
('Alta Verapaz', 'CAH');

-- ============================================
-- TABLE: comunidades
-- Communities where activities take place.
-- Each community belongs to exactly one department.
-- ============================================
CREATE TABLE comunidades (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(200) NOT NULL,
    departamento_id INTEGER NOT NULL REFERENCES departamentos(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLE: personal
-- Field managers and SEA technicians.
-- Each person works in exactly one department.
-- ============================================
CREATE TABLE personal (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    numero INTEGER,
    departamento_id INTEGER NOT NULL REFERENCES departamentos(id),
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLE: actividades (Laboral branch)
-- One row per reported work activity from KoBo.
-- FKs: departamento (where it happened),
--      personal (who reported it).
-- ============================================
CREATE TABLE actividades (
    id SERIAL PRIMARY KEY,

    -- KoBo identifiers (kobo_id is the upsert key on sync)
    kobo_id INTEGER UNIQUE,
    kobo_index INTEGER,
    kobo_uuid VARCHAR(100),

    -- Form timestamps
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    today DATE,

    -- Report date
    fecha_actividades DATE NOT NULL,

    -- Project data
    departamento_id INTEGER REFERENCES departamentos(id),
    personal_id INTEGER REFERENCES personal(id),

    -- Activity type
    tipo_actividad VARCHAR(100),

    -- Location
    ubicacion TEXT,

    -- Metrics
    comunidades_caracterizadas TEXT,
    familias_visitadas INTEGER DEFAULT 0,
    familias_caracterizadas INTEGER DEFAULT 0,
    familias_inscritas INTEGER DEFAULT 0,
    educadoras_inscritas INTEGER DEFAULT 0,
    educadoras_capacitadas INTEGER DEFAULT 0,
    educadoras_acompanadas INTEGER DEFAULT 0,
    participantes_visitados INTEGER DEFAULT 0,

    -- Summary
    resumen_actividad TEXT,
    nombres_participantes TEXT,

    -- Schedule
    hora_entrada TIME,
    hora_salida TIME,
    horas INTEGER,
    minutos INTEGER,

    -- Evidence (URLs)
    fotografia_1_url TEXT,
    fotografia_2_url TEXT,
    archivo_url TEXT,

    -- Challenges
    encontro_desafio VARCHAR(10),
    desafio TEXT,
    propuesta_solucion TEXT,

    -- Transport
    utilizo_transporte VARCHAR(10),
    tipo_transporte VARCHAR(50),
    kilometraje_odometro DECIMAL(10,2),
    kilometros_recorridos DECIMAL(10,2),
    costo_transporte DECIMAL(10,2),

    -- Planning
    coincide_planificacion VARCHAR(10),
    por_que_no_coincide TEXT,

    -- Observations
    observaciones_generales TEXT,

    -- Metadata
    estado_validacion VARCHAR(50),
    notas TEXT,
    enviado_por VARCHAR(100),
    version_formulario VARCHAR(50),

    -- System timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLE: permisos (Permiso branch)
-- One row per reported leave/permission from KoBo.
-- Separate table because the shape differs from a work
-- activity: no summary, transport, metrics or deliverables;
-- it records a non-worked day (date, type, reason).
-- Same FKs as actividades so monthly reports (viaticos)
-- can union both tables by fecha + personal.
-- ============================================
CREATE TABLE permisos (
    id SERIAL PRIMARY KEY,

    -- KoBo identifiers (kobo_id is the upsert key on sync)
    kobo_id INTEGER UNIQUE,
    kobo_uuid VARCHAR(100),

    -- Form timestamps
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    today DATE,

    -- Permission date (the non-worked day)
    fecha_permiso DATE NOT NULL,

    -- Permission detail
    tipo_permiso VARCHAR(100),
    motivo TEXT,
    justificacion TEXT,

    -- Project data
    departamento_id INTEGER REFERENCES departamentos(id),
    personal_id INTEGER REFERENCES personal(id),

    -- Time (always 0, kept so unions with actividades align)
    horas INTEGER DEFAULT 0,
    minutos INTEGER DEFAULT 0,

    -- Observations
    observaciones_generales TEXT,

    -- Metadata
    enviado_por VARCHAR(100),
    version_formulario VARCHAR(50),

    -- System timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLE: reportes_generados
-- Audit trail of reports generated from the dashboard
-- ============================================
CREATE TABLE reportes_generados (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(200) NOT NULL,
    tipo VARCHAR(50),
    fecha_inicio DATE,
    fecha_fin DATE,
    departamento_id INTEGER REFERENCES departamentos(id),
    personal_id INTEGER REFERENCES personal(id),
    formato VARCHAR(20),
    archivo_url TEXT,
    generado_por VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_actividades_fecha ON actividades(fecha_actividades);
CREATE INDEX idx_actividades_departamento ON actividades(departamento_id);
CREATE INDEX idx_actividades_personal ON actividades(personal_id);
CREATE INDEX idx_actividades_kobo_id ON actividades(kobo_id);
CREATE INDEX idx_permisos_fecha ON permisos(fecha_permiso);
CREATE INDEX idx_permisos_departamento ON permisos(departamento_id);
CREATE INDEX idx_permisos_personal ON permisos(personal_id);
CREATE INDEX idx_permisos_kobo_id ON permisos(kobo_id);
CREATE INDEX idx_comunidades_departamento ON comunidades(departamento_id);
CREATE INDEX idx_personal_departamento ON personal(departamento_id);
