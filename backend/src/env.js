const path = require('path');

// .env vive en la raiz del proyecto (puente-dashboard-completo/.env).
// Se prueban ambas rutas: junto al backend y en la raiz.
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

module.exports = {};
