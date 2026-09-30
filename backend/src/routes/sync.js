// Sync KoBo -> Postgres. Incremental append-only (last_sync).
// POST /api/sync (monitor) | GET /api/sync/estado
const pool = require('../db');
const { fetchSubmissions, resolvePersonal, mapActividad, mapPermiso, koboFetch } = require('../kobo');

async function getLastSync(client) {
  const { rows } = await client.query("SELECT valor FROM sync_estado WHERE clave = 'last_sync'");
  return rows[0]?.valor || null;
}

async function setLastSync(client, valor) {
  await client.query(
    "UPDATE sync_estado SET valor = $1, updated_at = CURRENT_TIMESTAMP WHERE clave = 'last_sync'",
    [valor]
  );
}

async function resolvePersonalId(client, cache, nombre, tipo, depId) {
  if (!nombre || !depId) return null;
  const key = `${depId}|${nombre}`;
  if (cache.has(key)) return cache.get(key);
  const { rows } = await client.query(
    'SELECT id FROM personal WHERE nombre = $1 AND departamento_id = $2',
    [nombre, depId]
  );
  let id;
  if (rows.length) {
    id = rows[0].id;
  } else {
    const ins = await client.query(
      'INSERT INTO personal (nombre, tipo, departamento_id) VALUES ($1, $2, $3) RETURNING id',
      [nombre, tipo, depId]
    );
    id = ins.rows[0].id;
  }
  cache.set(key, id);
  return id;
}

async function resolveComunidad(client, cache, nombre, depId) {
  if (!nombre || !depId) return;
  const clean = String(nombre).replace(/_/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 200);
  if (!clean) return;
  const key = `${depId}|${clean}`;
  if (cache.has(key)) return;
  await client.query(
    'INSERT INTO comunidades (nombre, departamento_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
    [clean, depId]
  );
  cache.set(key, true);
}

const ACT_COLS = [
  'kobo_id', 'kobo_uuid', 'start_time', 'end_time', 'today', 'fecha_actividades',
  'departamento_id', 'personal_id', 'tipo_actividad', 'ubicacion',
  'comunidades_caracterizadas', 'familias_visitadas', 'familias_caracterizadas',
  'familias_inscritas', 'educadoras_inscritas', 'educadoras_capacitadas',
  'educadoras_acompanadas', 'participantes_visitados',
  'resumen_actividad', 'nombres_participantes',
  'hora_entrada', 'hora_salida', 'horas', 'minutos', 'encontro_desafio', 'desafio',
  'propuesta_solucion', 'utilizo_transporte', 'tipo_transporte', 'kilometraje_odometro',
  'kilometros_recorridos', 'costo_transporte', 'coincide_planificacion',
  'observaciones_generales', 'enviado_por', 'version_formulario',
  'fotografia_1_url', 'fotografia_2_url',
];

async function upsertActividad(client, a) {
  const vals = [
    a.kobo_id, a.kobo_uuid, a.start_time, a.end_time, a.today, a.fecha,
    a.departamento_id, a.personal_id, a.tipo_actividad, a.ubicacion,
    a.comunidades_caracterizadas, a.familias_visitadas, a.familias_caracterizadas,
    a.familias_inscritas, a.educadoras_inscritas, a.educadoras_capacitadas,
    a.educadoras_acompanadas, a.participantes_visitados,
    a.resumen, a.nombres_participantes,
    a.hora_entrada, a.hora_salida, a.horas, a.minutos, a.encontro_desafio, a.desafio,
    a.propuesta_solucion, a.utilizo_transporte, a.tipo_transporte, a.kilometraje_odometro,
    a.kilometros_recorridos, a.costo_transporte, a.coincide, a.observaciones,
    a.enviado_por, a.version, a.foto1, a.foto2,
  ];
  const ph = vals.map((_, i) => `$${i + 1}`).join(', ');
  const upd = ACT_COLS.filter((c) => c !== 'kobo_id')
    .map((c) => `${c} = EXCLUDED.${c}`)
    .join(', ');
  await client.query(
    `INSERT INTO actividades (${ACT_COLS.join(', ')}) VALUES (${ph})
     ON CONFLICT (kobo_id) DO UPDATE SET ${upd}, updated_at = CURRENT_TIMESTAMP`,
    vals
  );
}

async function upsertPermiso(client, p) {
  await client.query(
    `INSERT INTO permisos (kobo_id, kobo_uuid, today, fecha_permiso, motivo, departamento_id, personal_id, observaciones_generales, enviado_por)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     ON CONFLICT (kobo_id) DO UPDATE SET
       kobo_uuid = EXCLUDED.kobo_uuid, today = EXCLUDED.today,
       fecha_permiso = EXCLUDED.fecha_permiso, motivo = EXCLUDED.motivo,
       departamento_id = EXCLUDED.departamento_id, personal_id = EXCLUDED.personal_id,
       observaciones_generales = EXCLUDED.observaciones_generales,
       enviado_por = EXCLUDED.enviado_por, updated_at = CURRENT_TIMESTAMP`,
    [p.kobo_id, p.kobo_uuid, p.today, p.fecha, p.motivo, p.departamento_id, p.personal_id, p.observaciones, p.enviado_por]
  );
}

async function fetchCount() {
  const data = await koboFetch('data/', { limit: 1 });
  return data.count || 0;
}

async function runSync() {
  const client = await pool.connect();
  try {
    const lastSync = await getLastSync(client);
    // Atajo barato: si el total KoBo coincide con la BD local y ya hubo sync,
    // no hay nada nuevo; se omite la descarga (las EDICIONES viejas igual
    // requieren "Resincronizar todo": KoBo no expone fecha de modificacion).
    if (lastSync) {
      const [remoto, local] = await Promise.all([
        fetchCount(),
        client.query('SELECT (SELECT COUNT(*) FROM actividades) + (SELECT COUNT(*) FROM permisos) AS total'),
      ]);
      if (Number(remoto) === Number(local.rows[0].total)) {
        return { actividades: 0, permisos: 0, total: 0, sinCambios: true, lastSync };
      }
    }
    const records = await fetchSubmissions({ since: lastSync });
    const personalCache = new Map();
    const comunidadCache = new Map();
    let actividades = 0, permisos = 0, maxTime = lastSync;

    for (const r of records) {
      const branch = r['group_fc5zu96/Actividad_a_Reportar'];
      const { depId, tipo, nombre } = resolvePersonal(r);
      const personalId = await resolvePersonalId(client, personalCache, nombre, tipo, depId);
      if (r._submission_time && (!maxTime || r._submission_time > maxTime)) {
        maxTime = r._submission_time;
      }
      if (branch === 'permiso') {
        const p = { ...mapPermiso(r), departamento_id: depId, personal_id: personalId };
        if (!p.fecha) continue;
        await upsertPermiso(client, p);
        permisos++;
      } else {
        const a = { ...mapActividad(r), departamento_id: depId, personal_id: personalId };
        if (!a.fecha) continue;
        await resolveComunidad(client, comunidadCache, a.ubicacion, depId);
        await upsertActividad(client, a);
        actividades++;
      }
    }
    if (maxTime) await setLastSync(client, maxTime);
    return { actividades, permisos, total: records.length, lastSync: maxTime };
  } finally {
    client.release();
  }
}

async function syncNow(req, res) {
  try {
    if (req.query.full === '1') {
      const client = await pool.connect();
      try {
        await client.query("UPDATE sync_estado SET valor = NULL WHERE clave = 'last_sync'");
      } finally {
        client.release();
      }
    }
    const result = await runSync();
    res.json({ ok: true, ...result });
  } catch (err) {
    console.error('sync error', err.message);
    res.status(502).json({ error: 'No se pudo sincronizar con KoBo' });
  }
}

async function syncEstado(req, res) {
  try {
    const { rows } = await pool.query(
      "SELECT valor, updated_at FROM sync_estado WHERE clave = 'last_sync'"
    );
    const counts = await pool.query(
      'SELECT (SELECT COUNT(*) FROM actividades) AS actividades, (SELECT COUNT(*) FROM permisos) AS permisos, (SELECT COUNT(*) FROM personal) AS personal'
    );
    res.json({ lastSync: rows[0]?.valor || null, ...counts.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Error al leer estado' });
  }
}

module.exports = { syncNow, syncEstado, runSync };
