// Gestion de usuarios (solo monitor).
// Crear usuario + cambiar clave con verificacion de clave del monitor.
const bcrypt = require('bcryptjs');
const pool = require('../db');

const ROLES = new Set(['monitor', 'encargado', 'gestor', 'tecnico']);

async function listUsuarios(req, res) {
  try {
    const { rows } = await pool.query(
      `SELECT u.id, u.username, u.nombre, u.rol, u.departamento_id,
              d.nombre AS departamento, u.personal_id,
              p.nombre AS personal, u.activo, u.created_at
       FROM usuarios u LEFT JOIN departamentos d ON d.id = u.departamento_id
       LEFT JOIN personal p ON p.id = u.personal_id
       ORDER BY u.rol, u.nombre`
    );
    res.json({ data: rows });
  } catch (err) {
    console.error('listUsuarios error', err);
    res.status(500).json({ error: 'Error al listar usuarios' });
  }
}

async function validarVinculo(client, personal_id, departamento_id, excluirId) {
  if (!personal_id) return null;
  const { rows } = await client.query('SELECT id, nombre, departamento_id FROM personal WHERE id = $1', [personal_id]);
  if (!rows.length) return 'Persona no existe';
  if (departamento_id && rows[0].departamento_id !== Number(departamento_id)) {
    return 'La persona no es de ese departamento';
  }
  const otro = await client.query(
    'SELECT id FROM usuarios WHERE personal_id = $1 AND id <> $2',
    [personal_id, excluirId || 0]
  );
  if (otro.rows.length) return 'Esa persona ya tiene usuario';
  return null;
}

async function createUsuario(req, res) {
  const client = await pool.connect();
  try {
    const { username, password, nombre, rol, departamento_id, personal_id } = req.body || {};
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
    if ((rol === 'gestor' || rol === 'tecnico') && !personal_id) {
      return res.status(400).json({ error: 'Gestor/técnico requiere persona vinculada' });
    }
    if ((rol === 'monitor' || rol === 'encargado') && personal_id) {
      return res.status(400).json({ error: 'Ese rol no lleva persona vinculada' });
    }
    const errV = await validarVinculo(client, personal_id, departamento_id, null);
    if (errV) return res.status(409).json({ error: errV });
    const hash = await bcrypt.hash(String(password), 10);
    const { rows } = await client.query(
      `INSERT INTO usuarios (username, nombre, rol, departamento_id, personal_id, password_hash)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, username, nombre, rol, departamento_id, personal_id`,
      [String(username).toLowerCase().trim(), String(nombre).trim(), rol,
       departamento_id || null, personal_id || null, hash]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Ese usuario ya existe' });
    console.error('createUsuario error', err);
    res.status(500).json({ error: 'Error al crear usuario' });
  } finally {
    client.release();
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

async function updateUsuario(req, res) {
  const client = await pool.connect();
  try {
    if (Number(req.params.id) === Number(req.user.id)) {
      return res.status(400).json({ error: 'No puedes editarte a ti mismo aquí' });
    }
    const { nombre, rol, departamento_id, personal_id } = req.body || {};
    if (!nombre || !rol) return res.status(400).json({ error: 'Nombre y rol requeridos' });
    if (!ROLES.has(rol)) return res.status(400).json({ error: 'Rol invalido' });
    if ((rol === 'gestor' || rol === 'tecnico') && !personal_id) {
      return res.status(400).json({ error: 'Gestor/técnico requiere persona vinculada' });
    }
    if ((rol === 'monitor' || rol === 'encargado') && personal_id) {
      return res.status(400).json({ error: 'Ese rol no lleva persona vinculada' });
    }
    const errV = await validarVinculo(client, personal_id, departamento_id, req.params.id);
    if (errV) return res.status(409).json({ error: errV });
    const { rows } = await client.query(
      `UPDATE usuarios SET nombre = $1, rol = $2, departamento_id = $3, personal_id = $4,
        updated_at = CURRENT_TIMESTAMP WHERE id = $5
       RETURNING id, username, nombre, rol, departamento_id, personal_id`,
      [String(nombre).trim(), rol, departamento_id || null, personal_id || null, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    console.error('updateUsuario error', err);
    res.status(500).json({ error: 'Error al actualizar usuario' });
  } finally {
    client.release();
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

module.exports = { listUsuarios, createUsuario, updateUsuario, changePassword, toggleActivo };
