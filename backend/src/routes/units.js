const express = require('express');
const router = express.Router();
const Unit = require('../models/Unit');
const auth = require('../middleware/auth');

// Criar unidade (admin)
router.post('/', auth, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Acesso negado' });
  const { number, block, description } = req.body;
  try {
    const unit = await Unit.create({ number, block, description });
    return res.json(unit);
  } catch (err) {
    return res.status(400).json({ error: 'Erro ao criar unidade', details: err.message });
  }
});

// Listar unidades
router.get('/', auth, async (req, res) => {
  try {
    const units = await Unit.findAll();
    return res.json(units);
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao listar unidades' });
  }
});

module.exports = router;
