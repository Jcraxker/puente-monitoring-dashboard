// Agregados reales para el dashboard.
const pool = require('../db');

async function kpis(req, res) {
  try {
    const { departamento_id, desde, hasta } = req.query;
    const params = [];
    const condA = [];
    const condP = [];
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
    const wA = condA.length ? `WHERE ${condA.join(' AND ')}` : '';
    const wP = condP.length ? `WHERE ${condP.join(' AND ')}` : '';

    const condC = [...condA, 'a.ubicacion IS NOT NULL'];
    const wC = `WHERE ${condC.join(' AND ')}`;
    const depParams = departamento_id ? [departamento_id] : [];
    const comWhere = departamento_id
      ? 'WHERE departamento_id = $1 AND ubicacion IS NOT NULL'
      : 'WHERE ubicacion IS NOT NULL';
    const [tot, per, com, topP, topC, via] = await Promise.all([
      pool.query(
        `SELECT (SELECT COUNT(*) FROM actividades a ${wA}) AS actividades,
                (SELECT COUNT(*) FROM permisos p2 ${wP}) AS permisos`,
        params
      ),
      pool.query(`SELECT COUNT(*) AS personal FROM personal ${departamento_id ? 'WHERE departamento_id = $1' : ''}`, depParams),
      pool.query(`SELECT COUNT(DISTINCT ubicacion) AS comunidades FROM actividades ${comWhere}`, depParams),
      pool.query(
        `SELECT p.nombre, COUNT(a.id) AS total
         FROM actividades a JOIN personal p ON p.id = a.personal_id
         ${wA} GROUP BY p.nombre ORDER BY total DESC LIMIT 6`,
        params
      ),
      pool.query(
        `SELECT a.ubicacion AS comunidad, COUNT(a.id) AS total
         FROM actividades a ${wC}
         GROUP BY a.ubicacion ORDER BY total DESC LIMIT 6`,
        params
      ),
      pool.query(
        `SELECT COALESCE(SUM(a.costo_transporte), 0) AS total FROM actividades a ${wA}`,
        params
      ),
    ]);

    res.json({
      actividades: Number(tot.rows[0].actividades),
      permisos: Number(tot.rows[0].permisos),
      personal: Number(per.rows[0].personal),
      comunidades: Number(com.rows[0].comunidades),
      porPersonal: topP.rows.map((r) => ({ nombre: r.nombre, total: Number(r.total) })),
      porComunidad: topC.rows.map((r) => ({ comunidad: r.comunidad, total: Number(r.total) })),
      viaticosTotal: Number(via.rows[0].total),
    });
  } catch (err) {
    console.error('kpis error', err);
    res.status(500).json({ error: 'Error al calcular indicadores' });
  }
}

module.exports = { kpis };
