const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();

const sequelize = require('./db');
const User = require('./models/User');
const Unit = require('./models/Unit');
const Visit = require('./models/Visit');

const authRoutes = require('./routes/auth');
const unitRoutes = require('./routes/units');
const visitRoutes = require('./routes/visits');

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.use('/api/auth', authRoutes);
app.use('/api/units', unitRoutes);
app.use('/api/visits', visitRoutes);

const PORT = process.env.PORT || 4000;

(async () => {
  try {
    // Sincroniza modelos
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Unable to connect to the database:', err);
  }
})();
