// Gestion de usuarios (solo monitor).
// Crear usuario + cambiar clave con verificacion de clave del monitor.
const bcrypt = require('bcryptjs');
const pool = require('../db');

const ROLES = new Set(['monitor', 'encargado', 'gestor', 'tecnico']);

async function listUsuarios(req, res) {
  try {
    const { rows } = await pool.query(
      `SELECT u.id, u.username, u.nombre, u.rol, u.departamento_id,
              d.nombre AS departamento, u.activo, u.created_at
       FROM usuarios u LEFT JOIN departamentos d ON d.id = u.departamento_id
       ORDER BY u.rol, u.nombre`
    );
    res.json({ data: rows });
  } catch (err) {
    console.error('listUsuarios error', err);
    res.status(500).json({ error: 'Error al listar usuarios' });
  }
}

async function createUsuario(req, res) {
  try {
    const { username, password, nombre, rol, departamento_id } = req.body || {};
    if (!username || !password || !nombre || !rol) {
      return res.status(400).json({ error: 'Usuario, clave, nombre y rol requeridos' });
    }
    if (!ROLES.has(rol)) return res.status(400).json({ error: 'Rol invalido' });
    if (String(password).length < 4) {
      return res.status(400).json({ error: 'La clave debe tener al menos 4 caracteres' });
    }
    if ((rol === 'encargado' || rol === 'gestor' || rol === 'tecnico') && !departamento_id) {
      return res.status(400).json({ error: 'Ese rol requiere departamento' });
    }
    const hash = await bcrypt.hash(String(password), 10);
    const { rows } = await pool.query(
      `INSERT INTO usuarios (username, nombre, rol, departamento_id, password_hash)
       VALUES ($1, $2, $3, $4, $5) RETURNING id, username, nombre, rol, departamento_id`,
      [String(username).toLowerCase().trim(), String(nombre).trim(), rol,
       departamento_id || null, hash]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Ese usuario ya existe' });
    console.error('createUsuario error', err);
    res.status(500).json({ error: 'Error al crear usuario' });
  }
}

// Cambiar clave de cualquier usuario verificando la clave del monitor en sesion.
async function changePassword(req, res) {
  try {
    const { newPassword, monitorPassword } = req.body || {};
    if (!newPassword || !monitorPassword) {
      return res.status(400).json({ error: 'Nueva clave y clave del monitor requeridas' });
    }
    if (String(newPassword).length < 4) {
      return res.status(400).json({ error: 'La clave debe tener al menos 4 caracteres' });
    }
    const { rows } = await pool.query('SELECT * FROM usuarios WHERE id = $1', [req.user.id]);
    const monitor = rows[0];
    if (!monitor || monitor.rol !== 'monitor') {
      return res.status(403).json({ error: 'Solo el monitor cambia claves' });
    }
    const ok = await bcrypt.compare(String(monitorPassword), monitor.password_hash);
    if (!ok) return res.status(401).json({ error: 'Clave del monitor incorrecta' });
    const hash = await bcrypt.hash(String(newPassword), 10);
    const upd = await pool.query(
      'UPDATE usuarios SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, username',
      [hash, req.params.id]
    );
    if (!upd.rows.length) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json({ ok: true, user: upd.rows[0] });
  } catch (err) {
    console.error('changePassword error', err);
    res.status(500).json({ error: 'Error al cambiar clave' });
  }
}

async function toggleActivo(req, res) {
  try {
    if (Number(req.params.id) === Number(req.user.id)) {
      return res.status(400).json({ error: 'No puedes desactivarte a ti mismo' });
    }
    const { rows } = await pool.query(
      'UPDATE usuarios SET activo = NOT activo, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING id, username, activo',
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    console.error('toggleActivo error', err);
    res.status(500).json({ error: 'Error al actualizar usuario' });
  }
}

module.exports = { listUsuarios, createUsuario, changePassword, toggleActivo };
