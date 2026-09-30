require('./env');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const pool = require('./db');
const { listActividades, getActividad, deleteActividad } = require('./routes/actividades');
const { login, me, loginLimiter } = require('./routes/auth');
const { authRequired, requireRole } = require('./middleware/auth');

const app = express();
app.disable('x-powered-by');

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: process.env.FRONTEND_ORIGIN?.split(',') || false }));
app.use(express.json({ limit: '1mb' }));

// Anti-abuso global (el login tiene su propio limite mas estricto)
app.use('/api/', rateLimit({
  windowMs: 60 * 1000,
  max: 300,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Demasiadas peticiones, espera un momento' },
}));

app.get('/health', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT 1 AS ok');
    res.json({ status: 'ok', db: rows[0].ok === 1 });
  } catch (err) {
    res.status(503).json({ status: 'error', db: false });
  }
});

app.post('/api/auth/login', loginLimiter, login);
app.get('/api/auth/me', authRequired, me);

app.get('/api/actividades', authRequired, listActividades);
app.get('/api/actividades/:id', authRequired, getActividad);
app.put('/api/actividades/:id/anular', authRequired, requireRole('monitor'), deleteActividad);

// Frontend estatico (misma URL = sin CORS en produccion)
const dist = path.join(__dirname, '..', '..', 'frontend', 'dist');
app.use(express.static(dist));
app.get(/^(?!\/api\/).*/, (req, res) => {
  res.sendFile(path.join(dist, 'index.html'), (err) => {
    if (err) res.status(404).json({ error: 'No encontrado' });
  });
});

// Errores nunca tumban el servidor
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('unhandled error', err.message);
  res.status(500).json({ error: 'Error interno' });
});

module.exports = app;
