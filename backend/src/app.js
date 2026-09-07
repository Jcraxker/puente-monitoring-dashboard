const express = require('express');
const cors = require('cors');
const pool = require('./db');
const { listActividades, getActividad, createActividad, updateActividad, deleteActividad } = require('./routes/actividades');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT 1 AS ok');
    res.json({ status: 'ok', db: rows[0].ok === 1 });
  } catch (err) {
    res.status(503).json({ status: 'error', db: false });
  }
});

app.get('/api/actividades', listActividades);
app.get('/api/actividades/:id', getActividad);
app.post('/api/actividades', createActividad);
app.put('/api/actividades/:id', updateActividad);
app.put('/api/actividades/:id/anular', deleteActividad);

module.exports = app;
