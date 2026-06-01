require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const helmet = require('helmet');
const cors = require('cors');
const catalogRoutes = require('./routes/catalogRoutes');

const app = express();
const PORT = process.env.PORT || process.env.CATALOG_SERVICE_PORT || 3004;

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use('/api/catalog', catalogRoutes);
app.get('/health', (req, res) => res.json({ status: 'healthy', service: 'catalog-service' }));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.statusCode || 500).json({ success: false, error: { message: err.message || 'Internal server error' } });
});

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/tomato_catalog')
  .then(() => app.listen(PORT, () => console.log(`Catalog Service running on port ${PORT}`)))
  .catch((err) => { console.error(err); process.exit(1); });

module.exports = app;
