// Correlativo real de folios. Serie mensual: PV-202609 -> PV-202609-001.
const pool = require('../db');

async function siguiente(req, res) {
  try {
    const serie = String(req.body?.serie || '').toUpperCase().slice(0, 20);
    if (!/^PV-\d{6}$/.test(serie)) {
      return res.status(400).json({ error: 'Serie invalida (formato PV-AAAAMM)' });
    }
    await pool.query(
      'INSERT INTO correlativos (serie, ultimo) VALUES ($1, 0) ON CONFLICT (serie) DO NOTHING',
      [serie]
    );
    const { rows } = await pool.query(
      'UPDATE correlativos SET ultimo = ultimo + 1, updated_at = CURRENT_TIMESTAMP WHERE serie = $1 RETURNING ultimo',
      [serie]
    );
    const numero = rows[0].ultimo;
    res.json({ serie, numero, folio: `${serie}-${String(numero).padStart(3, '0')}` });
  } catch (err) {
    console.error('correlativo error', err);
    res.status(500).json({ error: 'Error al generar folio' });
  }
}

// Devuelve el ultimo folio emitido cuando la constancia no llego a generarse.
// Solo retrocede si el folio sigue siendo el ultimo: evita corromper la serie.
async function devolver(req, res) {
  try {
    const serie = String(req.body?.serie || '').toUpperCase().slice(0, 20);
    const numero = Number(req.body?.numero);
    if (!/^PV-\d{6}$/.test(serie) || !Number.isInteger(numero) || numero < 1) {
      return res.status(400).json({ error: 'Serie o numero invalido' });
    }
    const { rows } = await pool.query(
      'UPDATE correlativos SET ultimo = ultimo - 1, updated_at = CURRENT_TIMESTAMP WHERE serie = $1 AND ultimo = $2 RETURNING ultimo',
      [serie, numero]
    );
    if (!rows.length) {
      const actual = await pool.query('SELECT ultimo FROM correlativos WHERE serie = $1', [serie]);
      return res.json({ serie, devuelto: false, ultimo: actual.rows[0]?.ultimo ?? null });
    }
    res.json({ serie, devuelto: true, ultimo: rows[0].ultimo });
  } catch (err) {
    console.error('correlativo devolver error', err);
    res.status(500).json({ error: 'Error al devolver folio' });
  }
}

module.exports = { siguiente, devolver };
