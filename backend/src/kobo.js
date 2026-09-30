// Cliente KoBoToolbox API v2 + mapeo a schema local.
// Fuente de labels: definicion del formulario "05 Reporte de actividades"
// (aLRi3VTfPcJDq248br6duP). Si el formulario cambia, actualizar estos mapas.

const API_URL = process.env.KOBO_API_URL || 'https://kf.kobotoolbox.org';
const FORM_UID = process.env.KOBO_FORM_UID;

const DEP_MAP = { CHIMa: 1, ALTAv: 2 };

// Codigo KoBo -> nombre limpio (sin "N. " inicial)
const PERSONAL_LABELS = {
  // Tecnicos PQL (us6pe63)
  option_1: 'Jonathan Cuxil', celso_cun: 'Cristian Sanic', job_quill: 'Wendy Esquit', 4: 'Leandro Chutá',
  // Gestores PQL (ha8ok78)
  barrio_san_pedro: 'Rosa Sirin', chinajuc: 'Lesvia Tubac', sta_mar_a_la_pila: 'Leimy Jutzuy',
  vilma_sisimit: 'Vilma Sisimit', 6: 'Maria Sanic', '6__jennifer_morales': 'Jennifer Morales',
  7: 'Joselin Ajquejay',
  // Tecnicos CAH (xm4jp44)
  a: 'Luis López', carlos_sotz: 'Edwinson Leal', david_morales: 'Héctor Coc',
  denis_sacul: 'Aristóteles Cac', dilmer_caal: 'Carlos Coc', nister_caal: 'Juan Jimenez',
  // Gestores CAH (mc7ny92) — codigos reutilizados de PQL con otro significado
  el_ranchito: 'Robin Pop', alejandra_barrientos: 'Idania Cac', ingrid_coy: 'Ercilia Reyes',
  dianisa_sub: 'Dianisa Sub', '9__veronica_choc': 'Ruben Cucul',
};

// CUIDADO: barrio_san_pedro, chinajuc, sta_mar_a_la_pila y 6/7 existen en
// ambas listas (PQL y CAH) con distinto significado. Se resuelven por DEP.
const GESTORES_CAH_OVERRIDE = {
  barrio_san_pedro: 'Olga Paná', chinajuc: 'Carla Cuc', sta_mar_a_la_pila: 'Orlando Choc',
  6: 'Gerzon Can', 7: 'Regilson Pán',
};

function cleanName(code, depId) {
  if (depId === 2 && GESTORES_CAH_OVERRIDE[code]) return GESTORES_CAH_OVERRIDE[code];
  return PERSONAL_LABELS[code] || code;
}

function g(obj, ...paths) {
  for (const p of paths) {
    if (obj[p] !== undefined && obj[p] !== null && obj[p] !== '') return obj[p];
  }
  return null;
}

function toDate(v) {
  if (!v) return null;
  const d = new Date(v);
  return isNaN(d) ? null : d.toISOString().slice(0, 10);
}

function toTime(v) {
  if (!v) return null;
  const m = String(v).match(/(\d{2}):(\d{2})/);
  return m ? `${m[1]}:${m[2]}:00` : null;
}

function toNum(v, def = 0) {
  const n = Number(v);
  return isNaN(n) ? def : n;
}

async function koboFetch(path, params = {}) {
  const qs = new URLSearchParams({ format: 'json', ...params }).toString();
  const res = await fetch(`${API_URL}/api/v2/assets/${FORM_UID}/${path}?${qs}`, {
    headers: { Authorization: `Token ${process.env.KOBO_TOKEN}` },
  });
  if (!res.ok) throw new Error(`KoBo ${res.status} en ${path}`);
  return res.json();
}

async function fetchSubmissions({ since = null, limit = 500 } = {}) {
  const out = [];
  let next = null;
  let params = { limit };
  if (since) params.query = JSON.stringify({ _submission_time: { $gte: since } });
  do {
    const url = next || `data/`;
    const data = next
      ? await (await fetch(next, { headers: { Authorization: `Token ${process.env.KOBO_TOKEN}` } })).json()
      : await koboFetch(url, params);
    out.push(...(data.results || []));
    next = data.next || null;
  } while (next);
  return out;
}

function resolvePersonal(r) {
  const depCode = g(r, 'group_fc5zu96/group_kw0gg02/DEP');
  const depId = DEP_MAP[depCode] || null;
  const tipo = g(
    r,
    'group_fc5zu96/group_kw0gg02/group_ja81w89/Personal_PQL',
    'group_fc5zu96/group_kw0gg02/group_fc0no89/Personal_CAH'
  );
  const code = g(
    r,
    'group_fc5zu96/group_kw0gg02/group_ja81w89/Agr_nomo_PQL',
    'group_fc5zu96/group_kw0gg02/group_ja81w89/No_GestorPQL',
    'group_fc5zu96/group_kw0gg02/group_fc0no89/Agr_nomo_CAH',
    'group_fc5zu96/group_kw0gg02/group_fc0no89/No_GestorCAH'
  );
  return {
    depId,
    tipo: tipo === 'agr_nomo' ? 'tecnico' : 'gestor',
    nombre: code ? cleanName(code, depId) : null,
  };
}

function mapActividad(r) {
  const fotos = (r._attachments || [])
    .filter((a) => a.mimetype && a.mimetype.startsWith('image/'))
    .map((a) => a.download_url)
    .slice(0, 2);
  const entrada = toTime(g(r, 'group_me5ww29/Hora_de_Entrada'));
  const salida = toTime(g(r, 'group_me5ww29/Hora_de_Salida'));
  let horas = 0, minutos = 0;
  if (entrada && salida) {
    const diff = (new Date(`2000-01-01T${salida}`) - new Date(`2000-01-01T${entrada}`)) / 60000;
    if (diff > 0) { horas = Math.floor(diff / 60); minutos = Math.round(diff % 60); }
  }
  return {
    kobo_id: r._id,
    kobo_uuid: r._uuid || null,
    start_time: r.start ? new Date(r.start) : null,
    end_time: r.end ? new Date(r.end) : null,
    today: toDate(r.today),
    fecha: toDate(g(r, 'group_fc5zu96/group_bo99w40/FEMB1')),
    tipo_actividad: g(r, 'group_fc5zu96/group_qj5ez41/group_nm2vu20/Tipo_de_Actividad', 'group_fc5zu96/group_qj5ez41/Tipo_de_Actividad_001'),
    ubicacion: g(r, 'group_cr73d31/Ubicaci_n_PQL', 'group_cr73d31/Ubicaci_n_CAH'),
    comunidades_caracterizadas: g(r, 'group_tl8cd90/Comunidades_Caracterizadas'),
    familias_visitadas: toNum(g(r, 'group_qe4pj41/Num1')),
    familias_caracterizadas: toNum(g(r, 'group_qe4pj41/Num2')),
    familias_inscritas: toNum(g(r, 'group_qe4pj41/Num3')),
    educadoras_inscritas: toNum(g(r, 'group_ee2ri28/Educ1')),
    educadoras_capacitadas: toNum(g(r, 'group_vr6sp23/Educaten1')),
    educadoras_acompanadas: toNum(g(r, 'group_vr6sp23/Educaten1_001')),
    participantes_visitados: toNum(g(r, 'group_cb2gp03/N_mero_de_Participantes_Visitados')),
    nombres_participantes: g(r, 'group_of2vg35/Nombres_de_los_Participantes'),
    resumen: g(r, 'group_of2vg35/Resumen_del_desarrollo_de_actividad'),
    hora_entrada: entrada, hora_salida: salida, horas, minutos,
    encontro_desafio: g(r, 'group_hv3sx25/_Encontr_desaf_os_o_dificulta'),
    desafio: g(r, 'group_hv3sx25/Desaf_o'),
    propuesta_solucion: g(r, 'group_hv3sx25/Propuesta_de_soluci_n'),
    utilizo_transporte: g(r, 'group_mx7uy35/_Utiliz_transporte_para_su_mo'),
    tipo_transporte: g(r, 'group_mx7uy35/Tipo_de_Transporte'),
    kilometraje_odometro: toNum(g(r, 'group_mx7uy35/group_fs4ju77/Kilometraje_en_Od_metro'), null),
    kilometros_recorridos: toNum(g(r, 'group_mx7uy35/group_fs4ju77/Kil_metros_Recorridos'), null),
    costo_transporte: toNum(g(r, 'group_mx7uy35/Costo_de_Transporte')),
    coincide: g(r, 'group_ju0jj47/_Su_actividad_coincide_con_su_'),
    observaciones: g(r, 'Observaciones_Generales'),
    enviado_por: r._submitted_by || null,
    version: r.__version__ || null,
    foto1: fotos[0] || null,
    foto2: fotos[1] || null,
    submission_time: r._submission_time ? new Date(r._submission_time) : null,
  };
}

function mapPermiso(r) {
  return {
    kobo_id: r._id,
    kobo_uuid: r._uuid || null,
    today: toDate(r.today),
    fecha: toDate(g(r, 'group_fc5zu96/group_cp2pj53/Fecha_de_permiso')),
    motivo: g(r, 'group_jn3qf58/Motivo'),
    coincide: g(r, 'group_ju0jj47/_Su_actividad_coincide_con_su_'),
    observaciones: g(r, 'Observaciones_Generales'),
    enviado_por: r._submitted_by || null,
    submission_time: r._submission_time ? new Date(r._submission_time) : null,
  };
}

module.exports = { fetchSubmissions, resolvePersonal, mapActividad, mapPermiso, koboFetch };
