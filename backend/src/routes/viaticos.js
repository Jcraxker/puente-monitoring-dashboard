// Viaticos: gasto real declarado por dia (costo_transporte) + permisos.
// El frontend agrupa por corte 16-15. Sin dato = la fila no se devuelve.
const pool = require('../db');
const LABELS = require('../kobo_labels.json');

function limpiarUbicacion(v) {
  if (!v) return null;
  return String(v).replace(/_/g, ' ').replace(/\s+/g, ' ').trim() || null;
}

function etiquetar(codigos) {
  if (!codigos) return null;
  return String(codigos)
    .split(/\s+/)
    .map((c) => LABELS[c] || c.replace(/_/g, ' '))
    .filter(Boolean)
    .join(', ');
}

async function listViaticos(req, res) {
  try {
    const { personal_id, departamento_id, desde, hasta } = req.query;
    const params = [];
    const condA = ['a.fecha_actividades IS NOT NULL'];
    const condP = ['p2.fecha_permiso IS NOT NULL'];

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

    const [acts, perm] = await Promise.all([
      pool.query(
        `SELECT a.fecha_actividades AS fecha, a.personal_id, p.nombre AS personal,
                a.departamento_id, a.ubicacion AS comunidad,
                a.tipo_actividad AS actividad, a.costo_transporte AS viatico,
                a.kilometros_recorridos AS kilometros, a.tipo_transporte
         FROM actividades a
         LEFT JOIN personal p ON p.id = a.personal_id
         WHERE ${condA.join(' AND ')}
         ORDER BY a.fecha_actividades ASC`,
        params
      ),
      pool.query(
        `SELECT p2.fecha_permiso AS fecha, p2.personal_id, p.nombre AS personal,
                p2.motivo
         FROM permisos p2
         LEFT JOIN personal p ON p.id = p2.personal_id
         WHERE ${condP.join(' AND ')}
         ORDER BY p2.fecha_permiso ASC`,
        params
      ),
    ]);

    res.json({
      data: acts.rows.map((r) => ({
        ...r,
        comunidad: limpiarUbicacion(r.comunidad),
        actividad: etiquetar(r.actividad),
        kilometros: r.kilometros != null ? Number(r.kilometros) : 0,
      })),
      permisos: perm.rows,
    });
  } catch (err) {
    console.error('listViaticos error', err);
    res.status(500).json({ error: 'Error al listar viaticos' });
  }
}

module.exports = { listViaticos };
