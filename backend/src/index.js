require('./env');
const app = require('./app');

const PORT = process.env.PORT || process.env.BACKEND_PORT || 3001;

app.listen(PORT, () => {
  console.log(`Puente backend listening on port ${PORT}`);
});
