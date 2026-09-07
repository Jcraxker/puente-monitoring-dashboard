require('dotenv').config({ path: '../.env' });
const pool = require('../src/db');

// Usernames, names and roles are public config.
// Password hashes come from the local .env (never committed).
const SEED_USERS = [
  { username: 'monitor', nombre: 'Monitor Principal', rol: 'monitor', departamento_id: null, hash: process.env.HASH_MONITOR },
  { username: 'gestor1', nombre: 'Rosa Sirin', rol: 'gestor', departamento_id: 1, hash: process.env.HASH_GESTOR1 },
  { username: 'tecnico1', nombre: 'Jonathan Cuxil', rol: 'tecnico', departamento_id: 1, hash: process.env.HASH_TECNICO1 },
];

async function seed() {
  for (const u of SEED_USERS) {
    if (!u.hash) {
      console.error(`Missing hash for ${u.username} (set HASH_${u.username.toUpperCase()} in .env)`);
      process.exitCode = 1;
      continue;
    }
    await pool.query(
      `INSERT INTO usuarios (username, nombre, rol, departamento_id, password_hash)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (username) DO UPDATE SET
         nombre = EXCLUDED.nombre,
         rol = EXCLUDED.rol,
         departamento_id = EXCLUDED.departamento_id,
         password_hash = EXCLUDED.password_hash,
         activo = TRUE,
         updated_at = CURRENT_TIMESTAMP`,
      [u.username, u.nombre, u.rol, u.departamento_id, u.hash]
    );
    console.log(`seeded ${u.username}`);
  }
  await pool.end();
}

seed().catch((err) => {
  console.error('seed failed', err);
  process.exitCode = 1;
});
