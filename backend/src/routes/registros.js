// Catalogos para filtros + endpoint combinado actividades/permisos.
const pool = require('../db');
const LABELS = require('../kobo_labels.json');

function etiquetar(codigos) {
  if (!codigos) return null;
  return String(codigos)
    .split(/\s+/)
    .map((c) => LABELS[c] || c.replace(/_/g, ' '))
    .filter(Boolean)
    .join(', ');
}

function etiquetarUno(codigo) {
  if (!codigo) return null;
  return LABELS[codigo] || String(codigo).replace(/_/g, ' ');
}

function limpiarUbicacion(v) {
  if (!v) return null;
  return String(v).replace(/_/g, ' ').replace(/\s+/g, ' ').trim() || null;
}

async function catalogos(req, res) {
  try {
    const [dep, per, com] = await Promise.all([
      pool.query('SELECT id, nombre, codigo FROM departamentos ORDER BY id'),
      pool.query(
        `SELECT p.id, p.nombre, p.tipo, p.departamento_id, d.nombre AS departamento
         FROM personal p LEFT JOIN departamentos d ON d.id = p.departamento_id
         ORDER BY p.nombre`
      ),
      pool.query(
        `SELECT c.id, c.nombre, c.departamento_id, d.nombre AS departamento,
                COUNT(a.id)::int AS total
         FROM comunidades c
         LEFT JOIN departamentos d ON d.id = c.departamento_id
         LEFT JOIN actividades a
           ON regexp_replace(trim(BOTH FROM replace(a.ubicacion, '_', ' ')), '\\s+', ' ', 'g') = c.nombre
           AND a.departamento_id = c.departamento_id
         GROUP BY c.id, d.nombre
         ORDER BY c.nombre`
      ),
    ]);
    res.json({ departamentos: dep.rows, personal: per.rows, comunidades: com.rows });
  } catch (err) {
    console.error('catalogos error', err);
    res.status(500).json({ error: 'Error al leer catalogos' });
  }
}

// Lista combinada para la tabla del frontend (replica lo que muestra el Excel).
async function registros(req, res) {
  try {
    const { personal_id, departamento_id, desde, hasta, q, tipo, limit = 100, page = 1 } = req.query;
    const lim = Math.min(Number(limit) || 100, 1000);
    const off = (Math.max(Number(page) || 1, 1) - 1) * lim;

    const condA = [];
    const condP = [];
    const params = [];

    if (personal_id) {
      params.push(personal_id);
      condA.push(`a.personal_id = $${params.length}`);
      condP.push(`p2.personal_id = $${params.length}`);
    }
    if (departamento_id) {
      params.push(departamento_id);
      condA.push(`a.departamento_id = $${params.length}`);
      condP.push(`p2.departamento_id = $${params.length}`);
    }
    if (desde) {
      params.push(desde);
      condA.push(`a.fecha_actividades >= $${params.length}`);
      condP.push(`p2.fecha_permiso >= $${params.length}`);
    }
    if (hasta) {
      params.push(hasta);
      condA.push(`a.fecha_actividades <= $${params.length}`);
      condP.push(`p2.fecha_permiso <= $${params.length}`);
    }
    if (q) {
      params.push(`%${q}%`);
      condA.push(`(a.resumen_actividad ILIKE $${params.length} OR a.ubicacion ILIKE $${params.length} OR a.tipo_actividad ILIKE $${params.length})`);
      condP.push(`(p2.motivo ILIKE $${params.length})`);
    }
    if (tipo === 'Actividad') condP.push('FALSE');
    if (tipo === 'Permiso') condA.push('FALSE');

    const wA = condA.length ? `WHERE ${condA.join(' AND ')}` : '';
    const wP = condP.length ? `WHERE ${condP.join(' AND ')}` : '';

    const base = `
      SELECT a.id, 'Actividad' AS tipo_registro, a.fecha_actividades AS fecha,
             a.personal_id, p.nombre AS personal, p.tipo AS rol,
             a.departamento_id, d.nombre AS departamento,
             a.ubicacion AS comunidad, a.tipo_actividad AS actividad,
             a.resumen_actividad AS resumen, a.hora_entrada, a.hora_salida,
             a.utilizo_transporte, a.tipo_transporte, a.costo_transporte AS viatico,
             a.kilometros_recorridos AS kilometraje, a.encontro_desafio,
             a.desafio AS dificultad, a.propuesta_solucion AS solucion,
             a.coincide_planificacion, a.observaciones_generales AS observaciones,
             a.fotografia_1_url AS foto1, a.fotografia_2_url AS foto2,
             a.comunidades_caracterizadas, a.familias_visitadas, a.familias_caracterizadas,
             a.familias_inscritas, a.educadoras_inscritas, a.educadoras_capacitadas,
             a.educadoras_acompanadas, a.participantes_visitados,
             a.nombres_participantes,
             a.enviado_por
      FROM actividades a
      LEFT JOIN personal p ON p.id = a.personal_id
      LEFT JOIN departamentos d ON d.id = a.departamento_id
      ${wA}
      UNION ALL
      SELECT p2.id, 'Permiso' AS tipo_registro, p2.fecha_permiso AS fecha,
             p2.personal_id, p.nombre AS personal, p.tipo AS rol,
             p2.departamento_id, d.nombre AS departamento,
             NULL AS comunidad, p2.motivo AS actividad,
             p2.motivo AS resumen, NULL AS hora_entrada, NULL AS hora_salida,
             NULL AS utilizo_transporte, NULL AS tipo_transporte, 0 AS viatico,
             NULL AS kilometraje, NULL AS encontro_desafio,
             NULL AS dificultad, NULL AS solucion,
             NULL AS coincide_planificacion, p2.observaciones_generales AS observaciones,
             NULL AS foto1, NULL AS foto2,
             NULL AS comunidades_caracterizadas, 0 AS familias_visitadas,
             0 AS familias_caracterizadas, 0 AS familias_inscritas,
             0 AS educadoras_inscritas, 0 AS educadoras_capacitadas,
             0 AS educadoras_acompanadas, 0 AS participantes_visitados,
             NULL AS nombres_participantes,
             p2.enviado_por
      FROM permisos p2
      LEFT JOIN personal p ON p.id = p2.personal_id
      LEFT JOIN departamentos d ON d.id = p2.departamento_id
      ${wP}`;

    const countRes = await pool.query(`SELECT COUNT(*) AS total FROM (${base}) t`, params);
    params.push(lim, off);
    const dataRes = await pool.query(
      `${base} ORDER BY fecha DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );
    const data = dataRes.rows.map((r) => ({
      ...r,
      comunidad: limpiarUbicacion(r.comunidad),
      actividad: r.tipo_registro === 'Permiso' ? r.actividad : etiquetar(r.actividad),
      transporte: etiquetarUno(r.tipo_transporte),
    }));
    res.json({ data, total: Number(countRes.rows[0].total), page: Number(page), limit: lim });
  } catch (err) {
    console.error('registros error', err);
    res.status(500).json({ error: 'Error al listar registros' });
  }
}

module.exports = { catalogos, registros };
