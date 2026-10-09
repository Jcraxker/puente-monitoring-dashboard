const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const pool = require('../db');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Demasiados intentos, espera 15 minutos' },
});

function signToken(user) {
  const days = Number(process.env.JWT_EXPIRES_DAYS) || 30;
  return jwt.sign(
    { id: user.id, username: user.username, nombre: user.nombre, rol: user.rol,
      departamento_id: user.departamento_id || null, departamento: user.departamento || null,
      personal_id: user.personal_id || null },
    process.env.JWT_SECRET,
    { expiresIn: `${days}d` }
  );
}

async function login(req, res) {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) {
      return res.status(400).json({ error: 'Usuario y clave requeridos' });
    }
    const { rows } = await pool.query(
      `SELECT u.*, d.nombre AS departamento
       FROM usuarios u LEFT JOIN departamentos d ON d.id = u.departamento_id
       WHERE u.username = $1 AND u.activo = TRUE`,
      [String(username).toLowerCase()]
    );
    if (!rows.length) {
      return res.status(401).json({ error: 'Credenciales invalidas' });
    }
    const user = rows[0];
    const ok = await bcrypt.compare(String(password), user.password_hash);
    if (!ok) {
      return res.status(401).json({ error: 'Credenciales invalidas' });
    }
    const { password_hash, ...safe } = user;
    res.json({ token: signToken(user), user: safe });
  } catch (err) {
    console.error('login error', err);
    res.status(500).json({ error: 'Error al iniciar sesion' });
  }
}

function me(req, res) {
  res.json({ user: req.user });
}

module.exports = { login, me, loginLimiter };
