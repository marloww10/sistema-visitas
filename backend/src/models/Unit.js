const { DataTypes } = require('sequelize');
const sequelize = require('../db');
const User = require('./User');

const Unit = sequelize.define('Unit', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  alameda: { type: DataTypes.STRING, allowNull: false }, // Novo: alameda obrigatória
  casa: { type: DataTypes.STRING, allowNull: true }, // Novo: casa opcional
  phone: { type: DataTypes.STRING, allowNull: true }, // Mantido
  description: { type: DataTypes.STRING, allowNull: true }
}, {
  tableName: 'units'
});

// Associação: Unit possui muitos Users (moradores)
Unit.hasMany(User, { as: 'residents', foreignKey: 'unitId' });
User.belongsTo(Unit, { as: 'unit', foreignKey: 'unitId' });

module.exports = Unit;