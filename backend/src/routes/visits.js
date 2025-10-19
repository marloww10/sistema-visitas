const express = require('express');
const router = express.Router();
const Visit = require('../models/Visit');
const Unit = require('../models/Unit');
const authMiddleware = require('../middleware/auth');
const { Op } = require('sequelize');
const moment = require('moment-timezone');
const { stringify } = require('csv-stringify'); // Alterado para assíncrono

// Cria uma nova visita
router.post('/', authMiddleware, async (req, res) => {
  const { visitorName, type, expectedAt, note } = req.body;
  try {
    const visit = await Visit.create({
      visitorName,
      type,
      expectedAt: expectedAt ? new Date(expectedAt) : null,
      note,
      createdBy: req.user.id,
      unitId: req.user.unitId,
      status: 'scheduled'
    });
    res.status(201).json(visit);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Carrega visitas de hoje
router.get('/today', authMiddleware, async (req, res) => {
  const { orderBy = 'expectedAt', orderDir = 'ASC', search, status, type } = req.query;
  const where = {};
  if (search) {
    where[Op.or] = [
      { visitorName: { [Op.iLike]: `%${search}%` } },
      { '$unit.alameda$': { [Op.iLike]: `%${search}%` } },
      { '$unit.casa$': { [Op.iLike]: `%${search}%` } }
    ];
  }
  if (status) where.status = status;
  if (type) where.type = type;
  where.expectedAt = {
    [Op.between]: [
      moment().startOf('day').toDate(),
      moment().endOf('day').toDate()
    ]
  };
  try {
    const visits = await Visit.findAll({
      where,
      include: [{
        model: Unit,
        as: 'unit',
        attributes: ['alameda', 'casa', 'phone']
      }],
      order: [[orderBy, orderDir]]
    });
    res.json(visits);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Carrega histórico de visitas
router.get('/history', authMiddleware, async (req, res) => {
  const { orderBy = 'expectedAt', orderDir = 'ASC', search, status, type } = req.query;
  const where = {};
  if (search) {
    where[Op.or] = [
      { visitorName: { [Op.iLike]: `%${search}%` } },
      { '$unit.alameda$': { [Op.iLike]: `%${search}%` } },
      { '$unit.casa$': { [Op.iLike]: `%${search}%` } }
    ];
  }
  if (status) where.status = status;
  if (type) where.type = type;
  try {
    const visits = await Visit.findAll({
      where,
      include: [{
        model: Unit,
        as: 'unit',
        attributes: ['alameda', 'casa', 'phone']
      }],
      order: [[orderBy, orderDir]]
    });
    res.json(visits);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Carrega visitas do morador
router.get('/my', authMiddleware, async (req, res) => {
  try {
    const visits = await Visit.findAll({
      where: { createdBy: req.user.id },
      include: [{
        model: Unit,
        as: 'unit',
        attributes: ['alameda', 'casa', 'phone']
      }],
      order: [['expectedAt', 'ASC']]
    });
    res.json(visits);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Cancela uma visita
router.post('/:id/cancel', authMiddleware, async (req, res) => {
  try {
    const visit = await Visit.findByPk(req.params.id);
    if (!visit) return res.status(404).json({ error: 'Visita não encontrada' });
    if (visit.createdBy !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Sem permissão' });
    }
    visit.status = 'cancelled';
    await visit.save();
    res.json(visit);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Check-in de uma visita
router.post('/:id/checkin', authMiddleware, async (req, res) => {
  try {
    const visit = await Visit.findByPk(req.params.id);
    if (!visit) return res.status(404).json({ error: 'Visita não encontrada' });
    if (req.user.role !== 'guard') return res.status(403).json({ error: 'Apenas porteiros podem fazer check-in' });
    visit.status = 'arrived';
    visit.arrivedAt = new Date();
    await visit.save();
    res.json(visit);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Check-out de uma visita
router.post('/:id/checkout', authMiddleware, async (req, res) => {
  try {
    const visit = await Visit.findByPk(req.params.id);
    if (!visit) return res.status(404).json({ error: 'Visita não encontrada' });
    if (req.user.role !== 'guard') return res.status(403).json({ error: 'Apenas porteiros podem fazer check-out' });
    visit.status = 'left';
    visit.leftAt = new Date();
    await visit.save();
    res.json(visit);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Exporta relatório em CSV
router.get('/export', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Apenas administradores podem exportar' });
    const visits = await Visit.findAll({
      include: [{
        model: Unit,
        as: 'unit',
        attributes: ['alameda', 'casa', 'phone']
      }],
      order: [['expectedAt', 'ASC']]
    });
    const records = visits.map(v => ({
      id: v.id,
      visitorName: v.visitorName,
      type: v.type,
      alameda: v.unit ? v.unit.alameda : '',
      casa: v.unit ? v.unit.casa : '',
      phone: v.unit ? v.unit.phone : '',
      note: v.note || '', // Inclui note
      expectedAt: v.expectedAt ? moment(v.expectedAt).format('DD/MM/YYYY HH:mm') : '',
      arrivedAt: v.arrivedAt ? moment(v.arrivedAt).format('DD/MM/YYYY HH:mm') : '',
      leftAt: v.leftAt ? moment(v.leftAt).format('DD/MM/YYYY HH:mm') : '',
      status: v.status
    }));
    stringify(records, {
      header: true,
      columns: ['id', 'visitorName', 'type', 'alameda', 'casa', 'phone', 'note', 'expectedAt', 'arrivedAt', 'leftAt', 'status']
    }, (err, csv) => {
      if (err) return res.status(400).json({ error: err.message });
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=visitas.csv');
      res.send(csv);
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;