const { DataTypes } = require('sequelize');
const sequelize = require('../db');
const Unit = require('./Unit');

const Visit = sequelize.define('Visit', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  visitorName: { type: DataTypes.STRING, allowNull: false },
  type: { type: DataTypes.ENUM('visita', 'entrega_comida', 'entrega_encomenda'), defaultValue: 'visita' }, // Atualizado com novas opções
  note: { type: DataTypes.STRING, allowNull: true },
  expectedAt: { type: DataTypes.DATE, allowNull: true },
  arrivedAt: { type: DataTypes.DATE, allowNull: true },
  leftAt: { type: DataTypes.DATE, allowNull: true },
  status: { type: DataTypes.ENUM('scheduled','arrived','left','cancelled'), defaultValue: 'scheduled' },
  createdBy: { type: DataTypes.INTEGER, allowNull: true } // user id who created
}, {
  tableName: 'visits'
});

// Associação: Visit pertence a Unit
Visit.belongsTo(Unit, { as: 'unit', foreignKey: 'unitId' });
Unit.hasMany(Visit, { as: 'visits', foreignKey: 'unitId' });

module.exports = Visit;