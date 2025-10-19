const sequelize = require('../db');
const User = require('../models/User');
const Unit = require('../models/Unit');
const Visit = require('../models/Visit');

(async () => {
  try {
    await sequelize.sync({ force: true });
    const unit = await Unit.create({ 
      alameda: 'Alameda 0', // Novo
      casa: 'Casa 10', // Novo
      phone: '(11) 99999-9999', // Mantido
      description: 'Unidade de teste' 
    });
    const admin = await User.create({ name: 'Admin', email: 'admin@cond.com', password: 'admin123', role: 'admin' });
    const guard = await User.create({ name: 'Porteiro', email: 'guard@cond.com', password: 'guard123', role: 'guard' });
    const resident = await User.create({ name: 'Morador', email: 'morador@cond.com', password: 'morador123', role: 'resident', unitId: unit.id });
    console.log('Seed completa');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();