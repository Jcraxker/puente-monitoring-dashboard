const path = require('path');

// dotenv es opcional: en local lee .env, en nube las vars ya vienen del entorno.
// (ademas evita fallos de empaquetado serverless si dotenv no se resuelve)
let dotenv = null;
try {
  dotenv = require('dotenv');
} catch {
  dotenv = null;
}

if (dotenv) {
  // .env vive en la raiz del proyecto (puente-dashboard-completo/.env).
  // Se prueban ambas rutas: junto al backend y en la raiz.
  dotenv.config({ path: path.join(__dirname, '..', '.env') });
  dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });
  dotenv.config({ path: path.join(__dirname, '..', '.env.local') });
}

module.exports = {};
