import { useState, useMemo, useEffect, useCallback } from 'react'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { api } from '../api'

const DEPARTAMENTOS_FALLBACK = ['Chimaltenango']
const PERSONAL_FALLBACK = [
  { nombre: 'Jonathan Cuxil', rol: 'Técnico SEA', departamento: 'Chimaltenango' },
  { nombre: 'Cristian Sanic', rol: 'Técnico SEA', departamento: 'Chimaltenango' },
  { nombre: 'Wendy Esquit', rol: 'Técnico SEA', departamento: 'Chimaltenango' },
  { nombre: 'Leandro Chutá', rol: 'Técnico SEA', departamento: 'Chimaltenango' },
  { nombre: 'Rosa Sirin', rol: 'Gestor Comunitario', departamento: 'Chimaltenango' },
  { nombre: 'Maria Sanic', rol: 'Gestor Comunitario', departamento: 'Chimaltenango' },
  { nombre: 'Vilma Sisimit', rol: 'Gestor Comunitario', departamento: 'Chimaltenango' },
  { nombre: 'Jennifer Morales', rol: 'Gestor Comunitario', departamento: 'Chimaltenango' },
  { nombre: 'Jessica Tepáz', rol: 'Gestor Comunitario', departamento: 'Chimaltenango' },
  { nombre: 'Leimy Jutzuy', rol: 'Gestor Comunitario', departamento: 'Chimaltenango' },
]


function getCorteActual() {
  const hoy = new Date()
  const dia = hoy.getDate()
  const mes = hoy.getMonth()
  const anio = hoy.getFullYear()

  let desde, hasta, label
  if (dia >= 16) {
    desde = new Date(anio, mes, 16)
    hasta = new Date(anio, mes + 1, 15)
    label = `${hoy.toLocaleString('es', { month: 'long' })} ${anio}`
  } else {
    desde = new Date(anio, mes - 1, 16)
    hasta = new Date(anio, mes, 15)
    label = `${desde.toLocaleString('es', { month: 'long' })} ${desde.getFullYear()}`
  }
  return {
    desde: desde.toISOString().split('T')[0],
    hasta: hasta.toISOString().split('T')[0],
    label: label.charAt(0).toUpperCase() + label.slice(1),
  }
}

function getSemanas(desde, hasta) {
  const fechaIni = new Date(desde + 'T00:00:00')
  const fechaFin = new Date(hasta + 'T00:00:00')
  const semanas = []

  const primerLunes = new Date(fechaIni)
  const dayOfWeek = primerLunes.getDay()
  const diffLunes = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
  primerLunes.setDate(primerLunes.getDate() + diffLunes)
  if (primerLunes > fechaIni) primerLunes.setDate(primerLunes.getDate() - 7)

  let actual = new Date(primerLunes)
  while (actual <= fechaFin) {
    const inicioSemana = new Date(actual)
    const finSemana = new Date(actual)
    finSemana.setDate(finSemana.getDate() + 6)

    const dias = []
    for (let d = new Date(inicioSemana); d <= finSemana; d.setDate(d.getDate() + 1)) {
      dias.push(new Date(d))
    }
    semanas.push({ inicio: inicioSemana, fin: finSemana, dias })
    actual.setDate(actual.getDate() + 7)
  }
  return semanas
}

function formatDia(fecha) {
  const nombres = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
  return nombres[fecha.getDay()]
}

function formatFecha(fecha) {
  const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
  return `${fecha.getDate()} ${meses[fecha.getMonth()]}`
}

function textoDia(r) {
  if (r.tipo === 'Permiso') return { texto: 'Permiso', clase: 'permiso' }
  if (r.viatico > 0) return { texto: `Q${r.viatico.toLocaleString()}`, clase: 'q' }
  if (r.kilometros > 0) return { texto: `${r.kilometros} km`, clase: 'km' }
  return { texto: '—', clase: 'vacio' }
}

// Datos KoBo son input de usuarios: escapar antes de innerHTML (constancia/PDF)
function escHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
}

function CeldaDia({ registro, esFuturo, esPasadoSinDeclarar }) {
  if (esFuturo) return <span className="text-sm text-[#e0e0e0]">·</span>
  if (esPasadoSinDeclarar) {
    return (
      <span className="inline-block text-[11px] font-semibold text-red-700 bg-red-50 border border-red-200 rounded px-1.5 py-0.5">
        Sin declarar
      </span>
    )
  }
  if (!registro) return <span className="text-sm font-medium text-[#d6d6d6]">—</span>
  const t = textoDia(registro)
  if (t.clase === 'q') return <span className="text-sm font-medium text-texto">{t.texto}</span>
  if (t.clase === 'km') return <span className="text-sm font-medium text-primary">{t.texto}</span>
  return <span className="text-sm font-medium text-[#d6d6d6]">—</span>
}

function mapearViaticos(v) {
  const acts = (v.data || []).map((r, i) => ({
    id: `a-${i}`,
    fecha: typeof r.fecha === 'string' ? r.fecha.slice(0, 10) : '',
    comunidad: r.comunidad || '—',
    actividad: r.actividad || '—',
    viatico: Number(r.viatico) || 0,
    kilometros: Number(r.kilometros) || 0,
    transporte: r.tipo_transporte || '',
    tipo: 'Actividad',
    personal: r.personal || 'Sin asignar',
    departamento: r.departamento_id === 1 ? 'Chimaltenango' : r.departamento_id === 2 ? 'Alta Verapaz' : '',
  }))
  const perm = (v.permisos || []).map((r, i) => ({
    id: `p-${i}`,
    fecha: typeof r.fecha === 'string' ? r.fecha.slice(0, 10) : '',
    comunidad: '—',
    actividad: r.motivo || 'Permiso',
    viatico: 0,
    kilometros: 0,
    transporte: '',
    tipo: 'Permiso',
    personal: r.personal || 'Sin asignar',
    departamento: '',
  }))
  return acts.concat(perm)
}

// Piezas de la constancia (compartidas entre vista impresion y paginador PDF)
const THEAD_HTML = `
<thead><tr>
  <th style="background:#124c91;color:white;padding:9px 6px;text-align:center;font-weight:700;width:5%;border-right:1px solid rgba(255,255,255,0.25);border-bottom:3px solid #fcce01">No.</th>
  <th style="background:#124c91;color:white;padding:9px 8px;text-align:left;font-weight:700;width:10%;border-right:1px solid rgba(255,255,255,0.25);border-bottom:3px solid #fcce01">Fecha</th>
  <th style="background:#124c91;color:white;padding:9px 8px;text-align:left;font-weight:700;width:16%;border-right:1px solid rgba(255,255,255,0.25);border-bottom:3px solid #fcce01">Comunidad</th>
  <th style="background:#124c91;color:white;padding:9px 8px;text-align:left;font-weight:700;word-wrap:break-word;border-right:1px solid rgba(255,255,255,0.25);border-bottom:3px solid #fcce01">Actividad</th>
  <th style="background:#124c91;color:white;padding:9px 8px;text-align:center;font-weight:700;width:10%;border-right:1px solid rgba(255,255,255,0.25);border-bottom:3px solid #fcce01">Tipo</th>
  <th style="background:#124c91;color:white;padding:9px 8px;text-align:right;font-weight:700;width:11%;border-right:1px solid rgba(255,255,255,0.25);border-bottom:3px solid #fcce01">Viático (Q)</th>
  <th style="background:#124c91;color:white;padding:9px 8px;text-align:right;font-weight:700;width:10%;border-bottom:3px solid #fcce01">Km (km)</th>
</tr></thead>`

function filaDatoHTML(r, i, sombrear) {
  const viaticoTxt = r.tipo === 'Permiso' ? '-' : r.viatico > 0 ? `Q${r.viatico.toLocaleString()}` : '—'
  const bg = sombrear ? 'background:#f4f7fd;' : ''
  return `
<tr>
  <td style="padding:9px 6px;border-bottom:1px solid #e6e6e6;vertical-align:middle;text-align:center;color:#747474;${bg}">${i + 1}</td>
  <td style="padding:9px 8px;border-bottom:1px solid #e6e6e6;vertical-align:middle;text-align:center;white-space:nowrap;${bg}">${formatFecha(new Date(r.fecha + 'T00:00:00'))}</td>
  <td style="padding:9px 8px;border-bottom:1px solid #e6e6e6;vertical-align:middle;text-align:center;word-wrap:break-word;${bg}">${escHtml(r.comunidad)}</td>
  <td style="padding:9px 8px;border-bottom:1px solid #e6e6e6;vertical-align:middle;word-wrap:break-word;${bg}">${escHtml(r.actividad)}</td>
  <td style="padding:9px 8px;border-bottom:1px solid #e6e6e6;vertical-align:middle;text-align:center;${bg}">${r.tipo}</td>
  <td style="padding:9px 8px;border-bottom:1px solid #e6e6e6;vertical-align:middle;text-align:right;font-weight:600;${bg}">${viaticoTxt}</td>
  <td style="padding:9px 8px;border-bottom:1px solid #e6e6e6;vertical-align:middle;text-align:right;${bg}">${r.kilometros > 0 ? `${r.kilometros} km` : '-'}</td>
</tr>`
}

function filaSubtotalHTML(nombre, tq, tk) {
  const txt = tq > 0 && tk > 0 ? `Q${tq.toLocaleString('es-GT')} · ${tk} km`
    : tq > 0 ? `Q${tq.toLocaleString('es-GT')}` : tk > 0 ? `${tk} km` : '—'
  return `
<tr><td colspan="7" style="background:#e8eefa;padding:7px 8px;text-align:right;font-weight:700;font-size:9pt;border-bottom:2px solid #124c91">
  Subtotal ${escHtml(nombre)}: <span style="color:#124c91">${txt}</span>
</td></tr>`
}

function filaGrupoHTML(nombre, sub) {
  return `
<tr data-grupo="1"><td colspan="7" style="background:#eef3fa;padding:6px 8px;font-weight:700;font-size:9pt;border-top:2px solid #124c91">
  ${escHtml(nombre)} <span style="font-weight:400;color:#747474">· ${sub}</span>
</td></tr>`
}

// Dias del corte (todos) + filas de estado para la constancia
function diasDelCorte(desde, hasta) {
  const out = []
  const ini = new Date(desde + 'T00:00:00')
  const fin = new Date(hasta + 'T00:00:00')
  for (let d = new Date(ini); d <= fin; d.setDate(d.getDate() + 1)) {
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    out.push({ fechaStr: `${d.getFullYear()}-${m}-${day}`, dow: d.getDay() })
  }
  return out
}

function hoyLocal() {
  const a = new Date()
  return `${a.getFullYear()}-${String(a.getMonth() + 1).padStart(2, '0')}-${String(a.getDate()).padStart(2, '0')}`
}

function filaVaciaHTML(fechaStr, i, sombrear, estado) {
  const esNoDec = estado === 'nodeclarado'
  const bg = esNoDec ? 'background:#fef2f2;' : (sombrear ? 'background:#f4f7fd;' : '')
  const act = esNoDec
    ? '<span style="color:#b91c1c;font-weight:700">No declarado</span>'
    : '<span style="color:#9ca3af">Pendiente</span>'
  return `
<tr>
  <td style="padding:9px 6px;border-bottom:1px solid #e6e6e6;vertical-align:middle;text-align:center;color:#747474;${bg}">${i + 1}</td>
  <td style="padding:9px 8px;border-bottom:1px solid #e6e6e6;vertical-align:middle;text-align:center;white-space:nowrap;${bg}">${formatFecha(new Date(fechaStr + 'T00:00:00'))}</td>
  <td style="padding:9px 8px;border-bottom:1px solid #e6e6e6;vertical-align:middle;text-align:center;${bg}">—</td>
  <td style="padding:9px 8px;border-bottom:1px solid #e6e6e6;vertical-align:middle;${bg}">${act}</td>
  <td style="padding:9px 8px;border-bottom:1px solid #e6e6e6;vertical-align:middle;text-align:center;${bg}">—</td>
  <td style="padding:9px 8px;border-bottom:1px solid #e6e6e6;vertical-align:middle;text-align:right;${bg}">—</td>
  <td style="padding:9px 8px;border-bottom:1px solid #e6e6e6;vertical-align:middle;text-align:right;${bg}">-</td>
</tr>`
}

// Filas de una persona: todos los dias habiles + fin de semana solo con dato.
// Devuelve array de <tr> (uno por unidad medible). ctx = { n } numeracion global.
function filasPersonaHTML(dias, porFecha, hoy, ctx) {
  const filas = []
  let j = 0
  const push = (s) => { filas.push(s); j++ }
  for (const d of dias) {
    const esFinde = d.dow === 0 || d.dow === 6
    const regs = porFecha[d.fechaStr] || []
    if (esFinde && regs.length === 0) continue
    if (regs.length > 0) {
      for (const r of regs) push(filaDatoHTML(r, ctx.n++, j % 2 === 1))
    } else if (d.fechaStr > hoy) {
      push(filaVaciaHTML(d.fechaStr, ctx.n++, j % 2 === 1, 'pendiente'))
    } else {
      push(filaVaciaHTML(d.fechaStr, ctx.n++, j % 2 === 1, 'nodeclarado'))
    }
  }
  return filas
}

export default function Viaticos({ usuario }) {
  const deptoFijo = usuario.rol === 'encargado' ? (usuario.departamento || '') : ''
  const corteInicial = useMemo(() => getCorteActual(), [])
  const [corteSeleccionado, setCorteSeleccionado] = useState(corteInicial)
  const [ampliarResumen, setAmpliarResumen] = useState(false)
  const [filtroDepartamento, setFiltroDepartamento] = useState(deptoFijo)
  const [filtroPersonal, setFiltroPersonal] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('')
  const [sincronizando, setSincronizando] = useState(false)
  const [ultimaSync, setUltimaSync] = useState(null)
  const [cooldownRestante, setCooldownRestante] = useState(0)
  const [mensajeSync, setMensajeSync] = useState(null)
  const [datos, setDatos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [cats, setCats] = useState(null)

  const esMonitor = usuario.rol === 'monitor'

  useEffect(() => {
    let vivo = true
    async function cargar() {
      try {
        const [c, v] = await Promise.all([
          api.catalogos(),
          api.viaticos({ desde: '2020-01-01' }),
        ])
        if (!vivo) return
        setCats(c)
        setDatos(mapearViaticos(v))
      } catch (err) {
        if (vivo) setMensajeSync({ tipo: 'error', texto: `No se pudieron cargar viaticos: ${err.message}` })
      } finally {
        if (vivo) setCargando(false)
      }
    }
    cargar()
    api.syncEstado().then(e => {
      if (vivo && e.lastSync) setUltimaSync(new Date(e.lastSync))
    }).catch(() => {})
    return () => { vivo = false }
  }, [])

  useEffect(() => {
    if (cooldownRestante <= 0) return
    const timer = setTimeout(() => setCooldownRestante(prev => prev - 1), 1000)
    return () => clearTimeout(timer)
  }, [cooldownRestante])

  const handleSyncRapido = useCallback(async () => {
    if (sincronizando || cooldownRestante > 0) return
    setSincronizando(true)
    setMensajeSync(null)
    try {
      const r = await api.sync()
      setUltimaSync(new Date())
      setCooldownRestante(300)
      setMensajeSync({ tipo: 'exito', texto: `Sincronizados ${r.total} registros (${r.actividades} actividades, ${r.permisos} permisos)` })
      const v = await api.viaticos({ desde: '2020-01-01' })
      setDatos(mapearViaticos(v))
    } catch (err) {
      setMensajeSync({ tipo: 'error', texto: `No se pudo sincronizar: ${err.message}` })
    }
    setSincronizando(false)
    setTimeout(() => setMensajeSync(null), 4000)
  }, [sincronizando, cooldownRestante])

  const PERSONAL = useMemo(() => {
    if (!cats) return PERSONAL_FALLBACK
    return cats.personal.map(p => ({
      nombre: p.nombre,
      rol: p.tipo === 'tecnico' ? 'Técnico SEA' : 'Gestor Comunitario',
      departamento: p.departamento || '',
    }))
  }, [cats])

  const DEPARTAMENTOS = useMemo(() => {
    if (!cats) return DEPARTAMENTOS_FALLBACK
    return cats.departamentos.map(d => d.nombre)
  }, [cats])

  const personalFiltrado = useMemo(() => {
    if (!filtroDepartamento) return PERSONAL
    return PERSONAL.filter(p => p.departamento === filtroDepartamento)
  }, [filtroDepartamento])

  const registrosVisibles = useMemo(() => {
    let data = datos
    if (usuario.rol === 'gestor' || usuario.rol === 'tecnico') {
      data = data.filter(r => r.personal === usuario.nombre)
    }
    if ((esMonitor || usuario.rol === 'encargado') && filtroDepartamento) {
      const personalEnDepto = PERSONAL.filter(p => p.departamento === filtroDepartamento).map(p => p.nombre)
      data = data.filter(r => personalEnDepto.includes(r.personal))
    }
    if (esMonitor && filtroPersonal) {
      data = data.filter(r => r.personal === filtroPersonal)
    }
    if (filtroTipo) {
      data = data.filter(r => r.tipo === filtroTipo)
    }
    return data
  }, [datos, esMonitor, usuario.nombre, filtroDepartamento, filtroPersonal, filtroTipo])

  const registrosEnCorte = useMemo(() => {
    const result = registrosVisibles.filter(r => r.fecha >= corteSeleccionado.desde && r.fecha <= corteSeleccionado.hasta)
    return result
  }, [registrosVisibles, corteSeleccionado])

  const cantidadActividades = registrosEnCorte.filter(r => r.tipo === 'Actividad').length
  const cantidadPermisos = registrosEnCorte.filter(r => r.tipo === 'Permiso').length

  const semanas = useMemo(() => {
    const semanasBase = getSemanas(corteSeleccionado.desde, corteSeleccionado.hasta)
    return semanasBase.map(sem => {
      const inicioStr = sem.inicio.toISOString().split('T')[0]
      const finStr = sem.fin.toISOString().split('T')[0]

      const registrosEnSemana = registrosVisibles.filter(r => {
        return r.fecha >= inicioStr && r.fecha <= finStr
      })

      const diasConMontos = sem.dias.map(dia => {
        const fechaStr = dia.toISOString().split('T')[0]
        const dentroRango = fechaStr >= corteSeleccionado.desde && fechaStr <= corteSeleccionado.hasta
        const registro = registrosEnSemana.find(r => r.fecha === fechaStr)
        const ahora = new Date()
        const hoyStr = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}-${String(ahora.getDate()).padStart(2, '0')}`
        const esFuturo = fechaStr > hoyStr
        const esHoy = fechaStr === hoyStr
        const esFinDe = dia.getDay() === 0 || dia.getDay() === 6
        const esPasadoSinDeclarar = dentroRango && !esFuturo && !esHoy && !esFinDe && !registro
        return {
          fecha: dia,
          fechaStr,
          dia: formatDia(dia),
          monto: registro ? registro.viatico : 0,
          km: registro ? (registro.kilometros || 0) : 0,
          dentroRango,
          registro,
          esFuturo,
          esPasadoSinDeclarar,
        }
      })

      const enRango = diasConMontos.filter(d => d.dentroRango)
      const totalDentroRango = enRango.reduce((acc, d) => acc + d.monto, 0)
      const totalKm = enRango.reduce((acc, d) => acc + d.km, 0)

      return {
        inicio: sem.inicio,
        fin: sem.fin,
        dias: diasConMontos,
        total: totalDentroRango,
        totalKm,
      }
    })
  }, [corteSeleccionado, registrosVisibles])

  const totalCorte = semanas.reduce((acc, s) => acc + s.total, 0)
  const totalKmCorte = semanas.reduce((acc, s) => acc + (s.totalKm || 0), 0)

  const personalRequerido = esMonitor && !filtroPersonal

  const haySabadosConDatos = semanas.some(s => s.dias.some(d => d.fecha.getDay() === 6 && (d.monto > 0 || d.km > 0)))
  const hayDomingosConDatos = semanas.some(s => s.dias.some(d => d.fecha.getDay() === 0 && (d.monto > 0 || d.km > 0)))
  const ocultarSabDom = !haySabadosConDatos && !hayDomingosConDatos

  const cortesDisponibles = useMemo(() => {
    const cortes = []
    const hoy = new Date()
    for (let i = 0; i < 6; i++) {
      const ref = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1)
      const mes = ref.getMonth()
      const anio = ref.getFullYear()
      let desde, hasta, label
      if (i === 0) {
        desde = new Date(anio, mes, 16)
        hasta = new Date(anio, mes + 1, 15)
        label = `${ref.toLocaleString('es', { month: 'long' })} ${anio}`
      } else {
        desde = new Date(anio, mes, 16)
        hasta = new Date(anio, mes + 1, 15)
        label = `${ref.toLocaleString('es', { month: 'long' })} ${anio}`
      }
      cortes.push({
        desde: desde.toISOString().split('T')[0],
        hasta: hasta.toISOString().split('T')[0],
        label: label.charAt(0).toUpperCase() + label.slice(1),
      })
    }
    return cortes
  }, [])


  // Paginas armadas por datos: encabezado repetido, grupos intactos, cierre junto
  const construirPaginas = useCallback((folio) => {
    const personalNombre = filtroPersonal || (esMonitor ? 'Todos los colaboradores' : usuario.nombre)
    const esResumenGeneral = esMonitor && !filtroPersonal
    const periodoTexto = `${corteSeleccionado.label} (${formatFecha(new Date(corteSeleccionado.desde + 'T00:00:00'))} - ${formatFecha(new Date(corteSeleccionado.hasta + 'T00:00:00'))})`
    const emitida = new Date().toLocaleDateString('es-GT', { day: '2-digit', month: '2-digit', year: 'numeric' })
    const titulo = esResumenGeneral ? 'RESUMEN DE VIATICOS' : 'CONSTANCIA DE VIATICOS'
    const infoPersonal = !esResumenGeneral && cats ? cats.personal.find(p => p.nombre === personalNombre) : null
    const rolTxt = infoPersonal ? (infoPersonal.tipo === 'tecnico' ? 'Tecnico SEA' : 'Gestor Comunitario') : ''
    const deptoTxt = infoPersonal ? (infoPersonal.departamento || '') : ''
    const registrosSorted = registrosEnCorte.slice().sort((a, b) => a.fecha.localeCompare(b.fecha))
    const totalGeneral = registrosSorted.reduce((acc, r) => acc + r.viatico, 0)
    const totalKm = registrosSorted.reduce((acc, r) => acc + (r.kilometros || 0), 0)

    const headFull = `
  <div style="text-align:center;margin-bottom:8px">
    <img src="${window.location.origin}/logo-puente-icon.png" style="display:block;width:130px;margin:0 auto" />
    <div style="font-size:32pt;color:#124c91;font-weight:800;letter-spacing:4px;margin-top:6px">puente</div>
    <div style="font-size:9pt;color:#747474;margin-top:6px">Monitoreo y Evaluacion</div>
  </div>
  <div style="text-align:center;font-size:15pt;font-weight:700;color:#124c91;margin:10px 0 2px;letter-spacing:1.5px">${titulo}</div>
  <div style="text-align:center;font-size:8.5pt;color:#747474;margin-bottom:14px">No. ${folio} · Emitida: ${emitida}</div>
  <div style="display:flex;gap:14px;margin-bottom:16px">
    <div style="flex:1.2;border:1px solid #d5dcea;border-radius:8px;padding:12px 16px;background:#fafbfe">
      <div style="font-size:7.5pt;color:#124c91;font-weight:700;letter-spacing:0.8px;margin-bottom:5px">COLABORADOR</div>
      <div style="font-size:11pt;font-weight:700;margin-bottom:2px">${escHtml(personalNombre)}</div>
      ${rolTxt ? `<div style="font-size:9pt;color:#747474;margin-bottom:2px">${escHtml(rolTxt)}</div>` : ''}
      ${esResumenGeneral
        ? '<div style="font-size:8.5pt;color:#747474">Todos los departamentos</div>'
        : `<div style="font-size:10pt;margin-top:4px">Proyecto: <strong style="color:#124c91;border-bottom:2px solid #fcce01;padding-bottom:1px">${escHtml(deptoTxt)}</strong></div>`}
    </div>
    <div style="flex:1;border:1px solid #d5dcea;border-radius:8px;padding:12px 16px;background:#fafbfe">
      <div style="font-size:7.5pt;color:#124c91;font-weight:700;letter-spacing:0.8px;margin-bottom:5px">PERIODO</div>
      <div style="font-size:11pt;font-weight:700">${periodoTexto}</div>
    </div>
  </div>`
    const headMini = `
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;border-bottom:2px solid #124c91;padding-bottom:6px">
    <div style="font-size:10pt;font-weight:700;color:#124c91">${titulo}</div>
    <div style="font-size:8pt;color:#747474">No. ${folio} · ${periodoTexto}</div>
  </div>`
    const abrir = (head) => `<div style="font-family:Arial,Helvetica,sans-serif;color:#212121;font-size:10pt;line-height:1.55;padding:14px 40px 20px;background:#fff;width:760px;max-width:760px;overflow:hidden">${head}<table style="width:100%;max-width:680px;table-layout:fixed;border-collapse:collapse;font-size:9pt;margin-bottom:0;border:1px solid #cfd8ea">${THEAD_HTML}<tbody>`
    const cerrarTabla = `</tbody></table>`
    const cierreTabla = `
    <tfoot><tr style="background:#e8eefa">
      <td colspan="5" style="padding:10px 8px;border-top:2px solid #124c91;text-align:right;font-weight:700;font-size:10pt">${esResumenGeneral ? 'TOTAL GENERAL' : 'TOTAL'}</td>
      <td style="padding:10px 8px;border-top:2px solid #124c91;text-align:right;font-weight:700;font-size:10pt;color:#124c91">Q${totalGeneral.toLocaleString('es-GT')}</td>
      <td style="padding:10px 8px;border-top:2px solid #124c91;text-align:right;font-weight:700;font-size:10pt;color:#124c91">${totalKm > 0 ? `${totalKm} km` : '-'}</td>
    </tr></tfoot>`
    const firmas = esResumenGeneral ? '' : `
  <div style="display:flex;justify-content:space-between;margin-top:36px;padding:0 8px">
    <div style="text-align:center;width:30%"><div style="border-top:1px solid #212121;margin-bottom:4px"></div><div style="font-size:8.5pt;color:#212121">Colaborador</div><div style="font-size:8pt;font-weight:700;color:#747474;margin-top:2px">${escHtml(personalNombre)}</div></div>
    <div style="text-align:center;width:30%"><div style="border-top:1px solid #212121;margin-bottom:4px"></div><div style="font-size:8.5pt;color:#212121">Jefe Inmediato</div></div>
    <div style="text-align:center;width:30%"><div style="border-top:1px solid #212121;margin-bottom:4px"></div><div style="font-size:8.5pt;color:#212121">A. Contable</div></div>
  </div>`
    const cierreExtras = `
  ${esResumenGeneral ? `<div style="border:2px solid #124c91;border-radius:8px;padding:10px 16px;text-align:center;margin:10px 0 8px;background:#f4f7fd">
    <span style="font-size:12pt;font-weight:700;color:#124c91">Total Q: Q${totalGeneral.toLocaleString('es-GT')}${totalKm > 0 ? ` · Total km: ${totalKm} km` : ''}</span><div style="font-size:7.5pt;color:#747474;margin-top:4px">Los kilometros son distancia en vehiculo propio y no suman quetzales</div>
  </div>` : ''}
  ${firmas}</div>`

    // Unidades indivisibles: encabezados de grupo + filas + cierre
    const modoPersona = (regs) => {
      const q = regs.some(r => r.viatico > 0)
      const k = regs.some(r => (r.kilometros || 0) > 0)
      if (q && k) return 'Mixto'
      if (q) return 'Q declarado'
      if (k) return 'Vehiculo propio'
      return 'Sin montos'
    }
    const unidades = []
    const ctx = { n: 0 }
    const dias = diasDelCorte(corteSeleccionado.desde, corteSeleccionado.hasta)
    const hoy = hoyLocal()
    const porFechaDe = (regs) => {
      const m = {}
      for (const r of regs) {
        if (!m[r.fecha]) m[r.fecha] = []
        m[r.fecha].push(r)
      }
      return m
    }
    if (esResumenGeneral) {
      const grupos = {}
      for (const r of registrosSorted) {
        if (!grupos[r.personal]) grupos[r.personal] = []
        grupos[r.personal].push(r)
      }
      for (const nombre of Object.keys(grupos).sort()) {
        const regs = grupos[nombre]
        const tq = regs.reduce((a, r) => a + r.viatico, 0)
        const tk = regs.reduce((a, r) => a + (r.kilometros || 0), 0)
        const sub = tq > 0 && tk > 0 ? `${modoPersona(regs)} · Q${tq.toLocaleString('es-GT')} · ${tk} km`
          : tq > 0 ? `${modoPersona(regs)} · Q${tq.toLocaleString('es-GT')}`
          : tk > 0 ? `${modoPersona(regs)} · ${tk} km` : modoPersona(regs)
        unidades.push({ kind: 'grupo', grupo: nombre, html: filaGrupoHTML(nombre, sub) })
        for (const f of filasPersonaHTML(dias, porFechaDe(regs), hoy, ctx)) {
          unidades.push({ kind: 'fila', grupo: nombre, html: f })
        }
        unidades.push({ kind: 'subtotal', grupo: nombre, html: filaSubtotalHTML(nombre, tq, tk) })
      }
    } else {
      for (const f of filasPersonaHTML(dias, porFechaDe(registrosSorted), hoy, ctx)) {
        unidades.push({ kind: 'fila', grupo: null, html: f })
      }
    }
    unidades.push({ kind: 'cierre', grupo: null })

    // Medir alturas reales
    const med = document.createElement('div')
    med.style.cssText = 'position:fixed;left:-9999px;top:0;width:760px;background:#fff;font-family:Arial,Helvetica,sans-serif;font-size:9pt'
    med.innerHTML = `<div style="padding:28px 40px 20px"><table style="width:100%;max-width:680px;table-layout:fixed;border-collapse:collapse">${THEAD_HTML}<tbody></tbody></table><div class="cierre"></div></div>`
    document.body.appendChild(med)
    const tbody = med.querySelector('tbody')
    const hOf = (html) => {
      tbody.insertAdjacentHTML('beforeend', html)
      const tr = tbody.lastElementChild
      const h = tr.offsetHeight
      tr.remove()
      return h
    }
    const alturas = unidades.map(u => {
      if (u.kind === 'cierre') {
        const c = med.querySelector('.cierre')
        c.innerHTML = `<table style="width:100%;max-width:680px;table-layout:fixed;border-collapse:collapse">${cierreTabla}</table>${cierreExtras}`
        const h = c.offsetHeight
        c.innerHTML = ''
        return h
      }
      return hOf(u.html)
    })
    const headFullH = (() => { const d = document.createElement('div'); d.style.cssText = 'position:fixed;left:-9999px;top:0;width:680px'; d.innerHTML = headFull; med.appendChild(d); const h = d.offsetHeight; d.remove(); return h })()
    const headMiniH = (() => { const d = document.createElement('div'); d.style.cssText = 'position:fixed;left:-9999px;top:0;width:680px'; d.innerHTML = headMini; med.appendChild(d); const h = d.offsetHeight; d.remove(); return h })()
    document.body.removeChild(med)

    // Distribuir: primera pagina con headFull, resto con headMini, cierre indivisible
    const LIM = 860
    const paginas = [[]]
    const alturasPag = [headFullH]
    let grupoEnPag = null
    unidades.forEach((u, idx) => {
      // Cada persona empieza en pagina nueva (resumen general)
      if (u.kind === 'grupo' && paginas[paginas.length - 1].length > 0) {
        paginas.push([])
        alturasPag.push(headMiniH)
        grupoEnPag = null
      }
      let need = alturas[idx]
      const abreGrupo = u.kind === 'fila' && u.grupo && u.grupo !== grupoEnPag
      if (abreGrupo) {
        const gh = alturas[unidades.findIndex(x => x.kind === 'grupo' && x.grupo === u.grupo)]
        need += gh
      }
      if (alturasPag[paginas.length - 1] + need > LIM && paginas[paginas.length - 1].length > 0) {
        paginas.push([])
        alturasPag.push(headMiniH)
        grupoEnPag = null
        if (u.kind === 'fila' && u.grupo && u.grupo !== grupoEnPag) {
          const gh = alturas[unidades.findIndex(x => x.kind === 'grupo' && x.grupo === u.grupo)]
          need = alturas[idx] + gh
        } else {
          need = alturas[idx]
        }
      }
      if (u.kind === 'fila' && u.grupo && u.grupo !== grupoEnPag) {
        const gi = unidades.findIndex(x => x.kind === 'grupo' && x.grupo === u.grupo)
        paginas[paginas.length - 1].push({ kind: 'grupo', html: unidades[gi].html })
        alturasPag[paginas.length - 1] += alturas[gi]
        grupoEnPag = u.grupo
      }
      paginas[paginas.length - 1].push(u)
      alturasPag[paginas.length - 1] += alturas[idx]
      if (u.kind === 'grupo') grupoEnPag = u.grupo
    })

    // Armar HTML por pagina
    return paginas.map((units, pi) => {
      const head = pi === 0 ? headFull : headMini
      let filas = ''
      let cierre = ''
      for (const u of units) {
        if (u.kind === 'cierre') {
          cierre = `<table style="width:100%;max-width:680px;table-layout:fixed;border-collapse:collapse;font-size:9pt;margin-bottom:0;border:1px solid #cfd8ea">${cierreTabla}</table>${cierreExtras}`
        } else {
          filas += u.html
        }
      }
      return `${abrir(head)}${filas}${cerrarTabla}${cierre}</div>`
    })
  }, [corteSeleccionado, filtroPersonal, esMonitor, usuario, registrosEnCorte, cats])

  const handleExportPDF = useCallback(async () => {
    try {
      const serie = `PV-${corteSeleccionado.desde.slice(0, 7).replace('-', '')}`
      let folio = null
      try {
        const r = await api.correlativo(serie)
        folio = r.folio
      } catch {
        folio = null
      }
      const personalNombre = filtroPersonal || (esMonitor ? 'Todos los colaboradores' : usuario.nombre)
      if (!folio) {
        const esumen = esMonitor && !filtroPersonal
        const ini = esumen ? 'TODOS' : personalNombre.split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase()
        folio = `${serie}-${ini}`
      }
      const paginasHTML = construirPaginas(folio)
      const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'letter', compress: true })
      const pageW = pdf.internal.pageSize.getWidth()
      const pageH = pdf.internal.pageSize.getHeight()
      const imgW = pageW - 30
      const totalPages = paginasHTML.length
      for (let p = 0; p < totalPages; p++) {
        if (p > 0) pdf.addPage()
        const container = document.createElement('div')
        container.style.cssText = 'position:fixed;left:-9999px;top:0;background:#fff'
        container.innerHTML = paginasHTML[p]
        document.body.appendChild(container)
        const canvas = await html2canvas(container, { scale: 1.25, useCORS: true, backgroundColor: '#ffffff' })
        document.body.removeChild(container)
        const imgH = (canvas.height * imgW) / canvas.width
        pdf.addImage(canvas.toDataURL('image/jpeg', 0.85), 'JPEG', 15, 15, imgW, imgH)
        pdf.setFont('helvetica', 'normal')
        pdf.setFontSize(8)
        pdf.setTextColor(116, 116, 116)
        const txt = `Pagina ${p + 1} de ${totalPages} · Folio ${folio}`
        const w = pdf.getTextWidth(txt)
        pdf.text(txt, (pageW - w) / 2, pageH - 10)
      }

      pdf.save(`viaticos_${personalNombre.replace(/\s+/g, '_')}_${corteSeleccionado.label.replace(/\s+/g, '_')}.pdf`)
    } catch (err) {
      console.error('Error al generar PDF:', err)
      alert('Error al generar PDF: ' + err.message)
    }
  }, [construirPaginas, corteSeleccionado, filtroPersonal, esMonitor, usuario])

  const handleImprimir = useCallback(async () => {
    const win = window.open('', '_blank')
    try {
      const serie = `PV-${corteSeleccionado.desde.slice(0, 7).replace('-', '')}`
      let folio = null
      try {
        const r = await api.correlativo(serie)
        folio = r.folio
      } catch {
        folio = null
      }
      const paginas = construirPaginas(folio)
      const cuerpo = paginas.map(h => `<div style="page-break-after:always">${h}</div>`).join('')
      if (win) {
        win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Constancia de Viaticos</title>
<style>@page{size:letter;margin:15mm 20mm}*{margin:0;padding:0;box-sizing:border-box}body{margin:0}table{page-break-inside:auto}tr{page-break-inside:avoid}</style></head><body>${cuerpo}</body></html>`)
        win.document.close()
        win.focus()
        setTimeout(() => win.print(), 400)
      }
    } catch (err) {
      if (win) win.close()
      alert('Error al preparar impresion: ' + err.message)
    }
  }, [construirPaginas, corteSeleccionado])

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-texto" style={{ fontFamily: 'var(--font-heading)' }}>Viáticos</h2>
          <p className="text-sm text-texto-secundario">Corte: {corteSeleccionado.label} ({formatFecha(new Date(corteSeleccionado.desde + 'T00:00:00'))} - {formatFecha(new Date(corteSeleccionado.hasta + 'T00:00:00'))})</p>
          {cargando && <p className="text-xs text-texto-secundario mt-0.5">Cargando datos...</p>}
          {ultimaSync && (
            <p className="text-xs text-texto-secundario mt-0.5">
              Última sincronización: {cooldownRestante > 0 ? `hace ${Math.floor((300 - cooldownRestante) / 60)}m ${300 - cooldownRestante % 60}s` : ultimaSync.toLocaleTimeString()}
            </p>
          )}
        </div>
        <div className="flex gap-2 items-center">
          <button
            onClick={handleSyncRapido}
            disabled={sincronizando || cooldownRestante > 0}
            className="px-4 py-2 bg-white border border-borde text-primary rounded-lg hover:bg-fondo-gris text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {sincronizando ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                Sincronizando...
              </>
            ) : cooldownRestante > 0 ? (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Disponible en {Math.ceil(cooldownRestante / 60)}m
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                Sincronizar
              </>
            )}
          </button>
          <button onClick={handleExportPDF} className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover text-sm font-medium transition-colors">
            {esMonitor && !filtroPersonal ? 'Descargar resumen de todos' : `Descargar resumen de ${filtroPersonal || usuario.nombre}`}
          </button>
          <button onClick={handleImprimir} className="px-4 py-2 bg-white border border-borde text-texto rounded-lg hover:bg-fondo-gris text-sm font-medium transition-colors">
            {esMonitor && !filtroPersonal ? 'Imprimir resumen de todos' : `Imprimir de ${filtroPersonal || usuario.nombre}`}
          </button>
        </div>
      </div>

      {/* Mensaje de sync */}
      {mensajeSync && (
        <div className={`rounded-lg p-3 text-sm font-medium flex items-center gap-2 ${
          mensajeSync.tipo === 'exito' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {mensajeSync.tipo === 'exito' ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          )}
          {mensajeSync.texto}
        </div>
      )}

      {/* Sección de Filtros */}
      <div className="bg-white rounded-lg border border-borde border-t-2 border-t-dorado p-4">
        <div className="flex items-center gap-2 mb-3">
          <svg className="w-4 h-4 text-texto-secundario" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          <h3 className="text-sm font-semibold text-texto" style={{ fontFamily: 'var(--font-heading)' }}>Filtros de búsqueda</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Periodo / Corte — siempre visible */}
          <div>
            <label className="block text-xs font-medium text-texto-secundario mb-1">Periodo / Corte</label>
            <p className="text-[11px] text-texto-secundario mb-1">Selecciona el mes a consultar</p>
            <select
              value={corteSeleccionado.desde}
              onChange={(e) => {
                const corte = cortesDisponibles.find(c => c.desde === e.target.value)
                if (corte) setCorteSeleccionado(corte)
              }}
              className="w-full px-3 py-2 border border-borde rounded-lg text-sm bg-white focus:ring-2 focus:ring-dorado focus:border-dorado outline-none"
            >
              {cortesDisponibles.map(c => (
                <option key={c.desde} value={c.desde}>{c.label}</option>
              ))}
            </select>
          </div>

          {/* Tipo — solo monitor */}
          {esMonitor && (
            <div>
              <label className="block text-xs font-medium text-texto-secundario mb-1">Tipo de registro</label>
              <p className="text-[11px] text-texto-secundario mb-1">Filtra por actividad o permiso</p>
              <select
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value)}
                className="w-full px-3 py-2 border border-borde rounded-lg text-sm bg-white focus:ring-2 focus:ring-dorado focus:border-dorado outline-none"
              >
                <option value="">Todos</option>
                <option value="Actividad">Actividad</option>
                <option value="Permiso">Permiso</option>
              </select>
            </div>
          )}

          {/* Departamento + Personal — solo monitor */}
          {esMonitor && (
            <>
              <div>
                <label className="block text-xs font-medium text-texto-secundario mb-1">Departamento</label>
                <p className="text-[11px] text-texto-secundario mb-1">Filtra por municipio / departamento</p>
                <select
                  value={filtroDepartamento}
                  onChange={(e) => { setFiltroDepartamento(e.target.value); setFiltroPersonal('') }}
                  className="w-full px-3 py-2 border border-borde rounded-lg text-sm bg-white focus:ring-2 focus:ring-dorado focus:border-dorado outline-none"
                >
                  <option value="">Todos los departamentos</option>
                  {DEPARTAMENTOS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-texto-secundario mb-1">Personal</label>
                <p className="text-[11px] text-texto-secundario mb-1">Selecciona la persona para ver su reporte</p>
                <select
                  value={filtroPersonal}
                  onChange={(e) => setFiltroPersonal(e.target.value)}
                  className="w-full px-3 py-2 border border-borde rounded-lg text-sm bg-white focus:ring-2 focus:ring-dorado focus:border-dorado outline-none"
                >
                  <option value="">-- Selecciona un colaborador --</option>
                  {['Técnico SEA', 'Gestor Comunitario'].map(rol => {
                    const grupo = personalFiltrado.filter(p => p.rol === rol)
                    if (grupo.length === 0) return null
                    return (
                      <optgroup key={rol} label={rol}>
                        {grupo.map(p => (
                          <option key={p.nombre} value={p.nombre}>{p.nombre}</option>
                        ))}
                      </optgroup>
                    )
                  })}
                </select>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Toggle ampliar resumen */}
      <div className="bg-white rounded-lg border border-borde p-4">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={ampliarResumen}
            onChange={(e) => setAmpliarResumen(e.target.checked)}
            className="w-4 h-4 text-primary bg-fondo-gris border-borde rounded focus:ring-dorado focus:ring-2"
          />
          <span className="text-sm font-medium text-texto">Ampliar resumen</span>
        </label>
      </div>

      {/* Gate: sin personal seleccionado, mostrar mensaje */}
      {personalRequerido ? (
        <div className="bg-primary/5 border border-blue-200 rounded-lg p-8 text-center">
          <svg className="w-12 h-12 text-blue-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <h3 className="text-lg font-medium text-blue-800 mb-1" style={{ fontFamily: 'var(--font-heading)' }}>Selecciona un colaborador</h3>
          <p className="text-sm text-primary">Para ver el reporte de viáticos, elige un departamento y luego selecciona a la persona en la sección de filtros de arriba.</p>
        </div>
      ) : ampliarResumen ? (
        /* Vista resumen — reemplaza la tabla */
        <div className="bg-white rounded-lg border border-borde p-6">
          <h3 className="text-lg font-semibold text-texto mb-1" style={{ fontFamily: 'var(--font-heading)' }}>Resumen del corte {corteSeleccionado.label}</h3>
          {esMonitor && filtroPersonal && (
            <p className="text-sm text-texto-secundario mb-4">Colaborador: <span className="font-medium text-texto">{filtroPersonal}</span></p>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-xs text-green-700 font-medium mb-1">Actividades</div>
              <div className="text-2xl font-bold text-green-700">{cantidadActividades}</div>
              <div className="text-[11px] text-green-500 mt-0.5">registros tipo actividad</div>
            </div>
            <div className="bg-[#fff3e6] rounded-lg p-4">
              <div className="text-xs text-coral font-medium mb-1">Permisos</div>
              <div className="text-2xl font-bold text-coral">{cantidadPermisos}</div>
              <div className="text-[11px] text-red-500 mt-0.5">registros tipo permiso</div>
            </div>
            <div className="bg-fondo-gris rounded-lg p-4">
              <div className="text-xs text-texto-secundario font-medium mb-1">Total registros</div>
              <div className="text-2xl font-bold text-texto">{registrosEnCorte.length}</div>
              <div className="text-[11px] text-texto-secundario mt-0.5">en este corte</div>
            </div>
            <div className="bg-primary/5 rounded-lg p-4">
              <div className="text-xs text-primary font-medium mb-1">Total corte</div>
              <div className="text-2xl font-bold text-primary">Q{totalCorte.toLocaleString()}</div>
              <div className="text-[11px] text-blue-500 mt-0.5">monto total en viáticos</div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-fondo-gris border-b border-borde">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-texto-secundario">Fecha</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-texto-secundario">Comunidad</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-texto-secundario">Actividad</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-texto-secundario">Tipo</th>
                  <th className="px-4 py-2 text-right text-xs font-semibold text-texto-secundario">Viático</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {registrosEnCorte
                  .sort((a, b) => a.fecha.localeCompare(b.fecha))
                  .map(r => (
                    <tr key={r.id} className="hover:bg-fondo-gris">
                      <td className="px-4 py-2 text-texto">{formatFecha(new Date(r.fecha + 'T00:00:00'))}</td>
                      <td className="px-4 py-2 text-texto">{r.comunidad}</td>
                      <td className="px-4 py-2 text-texto">{r.actividad}</td>
                      <td className="px-4 py-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${r.tipo === 'Actividad' ? 'bg-[#f0e6f6] text-fucsia' : 'bg-[#fff3e6] text-coral'}`}>
                          {r.tipo}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-right font-medium text-texto">{r.tipo === 'Permiso' && r.viatico === 0 ? '—' : `Q${r.viatico.toLocaleString()}`}</td>
                    </tr>
                  ))}
              </tbody>
              <tfoot className="bg-fondo-gris font-semibold">
                <tr>
                  <td colSpan={4} className="px-4 py-2 text-primary font-semibold">TOTAL CORTE</td>
                  <td className="px-4 py-2 text-right text-primary text-lg">Q{totalCorte.toLocaleString()}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      ) : (
        <>
          {/* Tabla Desktop */}
          <div className="hidden md:block bg-white rounded-lg border border-borde">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead className="bg-fondo-gris border-b border-borde">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-texto-secundario uppercase tracking-wider">Semana</th>
                    {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', ...(!ocultarSabDom ? ['Sáb', 'Dom'] : [])].map((dia, i) => (
                      <th key={i} className="px-4 py-3 text-center text-xs font-semibold text-texto-secundario uppercase tracking-wider">{dia}</th>
                    ))}
                    <th className="px-4 py-3 text-right text-xs font-semibold text-texto-secundario uppercase tracking-wider">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {semanas.map((semana, idx) => {
                    const diasVisibles = ocultarSabDom
                      ? semana.dias.filter(d => d.fecha.getDay() !== 0 && d.fecha.getDay() !== 6)
                      : semana.dias
                    return (
                      <tr key={idx} className="hover:bg-fondo-gris">
                        <td className="px-4 py-3 text-sm font-medium text-texto whitespace-nowrap">
                          S{idx + 1} ({formatFecha(semana.inicio)} — {formatFecha(semana.fin)})
                        </td>
                        {diasVisibles.map((d) => (
                          <td key={d.fechaStr} className={`px-3 py-3 text-center ${!d.dentroRango ? 'bg-[#f0f0f0]' : ''} ${d.registro && d.registro.tipo === 'Permiso' ? 'bg-[#fff3e6]/50' : ''}`}>
                            {d.dentroRango ? (
                              d.registro && d.registro.tipo === 'Permiso' ? (
                                <span className="text-xs text-coral font-medium italic">Permiso</span>
                              ) : (
                                <CeldaDia registro={d.registro} esFuturo={d.esFuturo} esPasadoSinDeclarar={d.esPasadoSinDeclarar} />
                              )
                            ) : (
                              <span className="text-[10px] text-[#b0b0b0]">—</span>
                            )}
                          </td>
                        ))}
                        <td className="px-4 py-3 text-right text-sm font-semibold text-primary whitespace-nowrap">
                          Q{semana.total.toLocaleString()}
                          {semana.totalKm > 0 && <span className="block text-xs font-normal text-texto-secundario">{semana.totalKm} km</span>}
                        </td>
                      </tr>
                    )
                  })}
                  <tr className="bg-fondo-gris font-semibold">
                    <td className="px-4 py-3 text-primary font-semibold">TOTAL CORTE</td>
                    <td colSpan={ocultarSabDom ? 5 : 7} />
                    <td className="px-4 py-3 text-right text-primary text-lg whitespace-nowrap">
                      Q{totalCorte.toLocaleString()}
                      {totalKmCorte > 0 && <span className="block text-xs font-normal text-texto-secundario">{totalKmCorte} km</span>}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Cards Móvil */}
          <div className="md:hidden space-y-3">
            {semanas.map((semana, idx) => (
              <div key={idx} className="bg-white rounded-lg border border-borde p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-texto">Semana {idx + 1}</span>
                  <span className="text-sm font-bold text-primary text-right">
                    Q{semana.total.toLocaleString()}
                    {semana.totalKm > 0 && <span className="block text-xs font-normal text-texto-secundario">{semana.totalKm} km</span>}
                  </span>
                </div>
                <div className="text-xs text-texto-secundario mb-3">{formatFecha(semana.inicio)} — {formatFecha(semana.fin)}</div>
                <div className={`grid gap-1.5 text-center ${ocultarSabDom ? 'grid-cols-5' : 'grid-cols-7'}`}>
                  {(ocultarSabDom
                    ? semana.dias.filter(d => d.fecha.getDay() !== 0 && d.fecha.getDay() !== 6)
                    : semana.dias
                  ).map((d) => (
                    <div key={d.fechaStr} className={`text-xs rounded p-1.5 ${!d.dentroRango ? 'bg-[#f0f0f0] opacity-60' : ''} ${d.registro && d.registro.tipo === 'Permiso' ? 'bg-[#fff3e6]/50' : ''}`}>
                      <div className="text-texto-secundario font-medium">{d.dia}</div>
                      {d.dentroRango ? (
                        d.registro && d.registro.tipo === 'Permiso' ? (
                          <div className="text-[10px] text-coral font-medium italic mt-0.5">Permiso</div>
                        ) : (
                          <div className="font-semibold mt-0.5">
                            <CeldaDia registro={d.registro} esFuturo={d.esFuturo} esPasadoSinDeclarar={d.esPasadoSinDeclarar} />
                          </div>
                        )
                      ) : (
                        <div className="text-[10px] text-[#b0b0b0] mt-0.5">—</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <div className="bg-fondo-gris rounded-lg border border-borde p-4 flex items-center justify-between">
              <span className="text-sm font-bold text-primary">TOTAL CORTE</span>
              <span className="text-lg font-bold text-primary text-right">
                Q{totalCorte.toLocaleString()}
                {totalKmCorte > 0 && <span className="block text-xs font-normal text-texto-secundario">{totalKmCorte} km</span>}
              </span>
            </div>
          </div>
        </>
      )}

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
        <strong>Nota:</strong> Los viáticos se calculan automáticamente desde las actividades registradas por cada técnico.
      </div>
    </div>
  )
}