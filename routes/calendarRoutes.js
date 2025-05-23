const express = require('express');
const router = express.Router();
const { getUserSelections, setUserSelections } = require('../controllers/calendarController');
const { getAllTurnosPorHorario } = require('../controllers/calendarController');
const auth = require('../middleware/authMiddleware');

router.get('/mis-turnos', auth, getUserSelections);
router.post('/asignar-turnos', auth, setUserSelections);
router.get('/turnos', auth, getAllTurnosPorHorario);

module.exports = router;