const pool = require('../db');

const ALLOWED_SORT = new Set(['fecha_actividades', 'created_at', 'id']);
const ALLOWED_ORDER = new Set(['asc', 'desc']);

async function listActividades(req, res) {
  try {
    const {
      personal_id,
      departamento_id,
      desde,
      hasta,
      q,
      limit = 20,
      offset = 0,
      sort = 'fecha_actividades',
      order = 'desc',
    } = req.query;

    const conditions = [];
    const params = [];

    if (personal_id) {
      params.push(personal_id);
      conditions.push(`a.personal_id = $${params.length}`);
    }
    if (departamento_id) {
      params.push(departamento_id);
      conditions.push(`a.departamento_id = $${params.length}`);
    }
    if (desde) {
      params.push(desde);
      conditions.push(`a.fecha_actividades >= $${params.length}`);
    }
    if (hasta) {
      params.push(hasta);
      conditions.push(`a.fecha_actividades <= $${params.length}`);
    }
    if (q) {
      params.push(`%${q}%`);
      conditions.push(`(a.resumen_actividad ILIKE $${params.length} OR a.ubicacion ILIKE $${params.length} OR a.tipo_actividad ILIKE $${params.length})`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const sortCol = ALLOWED_SORT.has(sort) ? sort : 'fecha_actividades';
    const sortDir = ALLOWED_ORDER.has(String(order).toLowerCase()) ? String(order).toUpperCase() : 'DESC';

    params.push(Math.min(Number(limit) || 20, 100));
    const limitParam = params.length;
    params.push(Math.max(Number(offset) || 0, 0));
    const offsetParam = params.length;

    const dataQuery = `
      SELECT a.*,
             p.nombre AS personal_nombre,
             d.nombre AS departamento_nombre,
             d.codigo AS departamento_codigo
      FROM actividades a
      LEFT JOIN personal p ON p.id = a.personal_id
      LEFT JOIN departamentos d ON d.id = a.departamento_id
      ${where}
      ORDER BY a.${sortCol} ${sortDir}
      LIMIT $${limitParam} OFFSET $${offsetParam}`;

    const countQuery = `SELECT COUNT(*) AS total FROM actividades a ${where}`;

    const [data, count] = await Promise.all([
      pool.query(dataQuery, params),
      pool.query(countQuery, params.slice(0, -2)),
    ]);

    res.json({
      data: data.rows,
      total: Number(count.rows[0].total),
      limit: Number(params[limitParam - 1]),
      offset: Number(params[offsetParam - 1]),
    });
  } catch (err) {
    console.error('listActividades error', err);
    res.status(500).json({ error: 'Error al listar actividades' });
  }
}

async function getActividad(req, res) {
  try {
    const { rows } = await pool.query(
      `SELECT a.*,
              p.nombre AS personal_nombre,
              d.nombre AS departamento_nombre,
              d.codigo AS departamento_codigo
       FROM actividades a
       LEFT JOIN personal p ON p.id = a.personal_id
       LEFT JOIN departamentos d ON d.id = a.departamento_id
       WHERE a.id = $1`,
      [req.params.id]
    );
    if (!rows.length) {
      return res.status(404).json({ error: 'Actividad no encontrada' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('getActividad error', err);
    res.status(500).json({ error: 'Error al obtener actividad' });
  }
}

async function createActividad(req, res) {
  try {
    if (!req.body.fecha_actividades) {
      return res.status(400).json({ error: 'fecha_actividades es requerida' });
    }
    const { rows } = await pool.query(
      `INSERT INTO actividades
         (fecha_actividades, departamento_id, personal_id,
          tipo_actividad, ubicacion, resumen_actividad)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        req.body.fecha_actividades,
        req.body.departamento_id,
        req.body.personal_id,
        req.body.tipo_actividad,
        req.body.ubicacion,
        req.body.resumen_actividad,
      ]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('createActividad error', err);
    res.status(500).json({ error: 'Error al crear actividad' });
  }
}

async function updateActividad(req, res) {
  try {
    if (!req.body.fecha_actividades) {
      return res.status(400).json({ error: 'fecha_actividades es requerida' });
    }
    const { rows } = await pool.query(
      `UPDATE actividades
         
      SET
        fecha_actividades = $1, 
        departamento_id = $2, 
        personal_id = $3,
        tipo_actividad = $4, 
        ubicacion = $5, 
        resumen_actividad = $6
      WHERE id = $7
       RETURNING *`,
      [
        req.body.fecha_actividades,
        req.body.departamento_id,
        req.body.personal_id,
        req.body.tipo_actividad,
        req.body.ubicacion,
        req.body.resumen_actividad,
        req.params.id
      ]
    );
    if (!rows.length) {
      return res.status(404).json({ error: 'Actividad no encontrada' });
    }
    res.status(200).json(rows[0]);
  } catch (err) {
    console.error('updateActividad error', err);
    res.status(500).json({ error: 'Error al actualizar actividad' });
  }
}

async function deleteActividad(req, res) {
  try {
    const {rows} = await pool.query(
    `UPDATE actividades
    
    SET
      estado_validacion = 'anulado'
      WHERE id = $1
      RETURNING *`,
    [req.params.id]
  );
  if (!rows.length) {
    return res.status(404).json({ error: 'Actividad no encontrada'});
  }
  res.status(200).json(rows[0]);
  } catch (err) {
    console.error('deleteActividad error', err);
    res.status(500).json({error: 'Error al anular la actividad'});
  }
  
}
module.exports = { listActividades, getActividad, createActividad, updateActividad, deleteActividad };
