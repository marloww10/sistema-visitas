const { DataTypes } = require('sequelize');
const sequelize = require('../db');
const bcrypt = require('bcrypt');

const User = sequelize.define('User', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  password: { type: DataTypes.STRING, allowNull: false },
  role: { type: DataTypes.ENUM('resident','guard','admin'), defaultValue: 'resident' }
}, {
  tableName: 'users'
});

User.beforeCreate(async (user) => {
  const hash = await bcrypt.hash(user.password, 10);
  user.password = hash;
});

User.prototype.comparePassword = function(password) {
  return bcrypt.compare(password, this.password);
}

module.exports = User;
