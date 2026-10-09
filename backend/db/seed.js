require('../src/env');
const pool = require('../src/db');

// Usernames, names and roles are public config.
// Password hashes come from the local .env (never committed).
const SEED_USERS = [
  { username: 'monitor', nombre: 'Monitor Principal', rol: 'monitor', departamento_id: null, personal: null, hash: process.env.HASH_MONITOR },
  { username: 'gestor1', nombre: 'Rosa Sirin', rol: 'gestor', departamento_id: 1, personal: 'Rosa Sirin', hash: process.env.HASH_GESTOR1 },
  { username: 'tecnico1', nombre: 'Jonathan Cuxil', rol: 'tecnico', departamento_id: 1, personal: 'Jonathan Cuxil', hash: process.env.HASH_TECNICO1 },
  { username: 'enc_pql', nombre: 'Encargado Chimaltenango', rol: 'encargado', departamento_id: 1, personal: null, hash: process.env.HASH_ENC_PQL },
  { username: 'enc_cah', nombre: 'Encargado Alta Verapaz', rol: 'encargado', departamento_id: 2, personal: null, hash: process.env.HASH_ENC_CAH },
];

async function personalId(client, nombre, departamento_id) {
  if (!nombre) return null;
  const { rows } = await client.query(
    'SELECT id FROM personal WHERE nombre = $1 AND departamento_id = $2',
    [nombre, departamento_id]
  );
  return rows.length ? rows[0].id : null;
}

async function seed() {
  const client = await pool.connect();
  try {
    for (const u of SEED_USERS) {
      if (!u.hash) {
        console.error(`Missing hash for ${u.username} (set HASH_${u.username.toUpperCase()} in .env)`);
        process.exitCode = 1;
        continue;
      }
      const pid = await personalId(client, u.personal, u.departamento_id);
      await client.query(
        `INSERT INTO usuarios (username, nombre, rol, departamento_id, personal_id, password_hash)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (username) DO UPDATE SET
           nombre = EXCLUDED.nombre,
           rol = EXCLUDED.rol,
           departamento_id = EXCLUDED.departamento_id,
           personal_id = EXCLUDED.personal_id,
           password_hash = EXCLUDED.password_hash,
           activo = TRUE,
           updated_at = CURRENT_TIMESTAMP`,
        [u.username, u.nombre, u.rol, u.departamento_id, pid, u.hash]
      );
      console.log(`seeded ${u.username}${pid ? ` -> personal ${pid}` : ''}`);
    }
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch((err) => {
  console.error('seed failed', err);
  process.exitCode = 1;
});
