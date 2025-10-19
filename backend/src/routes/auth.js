const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Unit = require('../models/Unit');
const jwt = require('jsonwebtoken');
const authMiddleware = require('../middleware/auth');

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ where: { email }, include: [{ model: Unit, as: 'unit' }] });
    if (!user) return res.status(401).json({ error: 'Credenciais inválidas' });
    const valid = await user.comparePassword(password);
    if (!valid) return res.status(401).json({ error: 'Credenciais inválidas' });
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, user: { id: user.id, name: user.name, role: user.role, unit: user.unit } });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/register', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Apenas administradores podem cadastrar' });
  const { name, email, password, role, alameda, casa, phone, description } = req.body;
  try {
    const [unit] = await Unit.findOrCreate({
      where: { alameda, casa },
      defaults: { alameda, casa, phone, description }
    });
    const user = await User.create({ name, email, password, role, unitId: unit.id });
    res.status(201).json({ user });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;