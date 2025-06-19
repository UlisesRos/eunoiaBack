const express = require('express');
const router = express.Router();
const { getUserSelections, setUserSelections, adminMoverUsuario, getAllTurnosPorHorario, marcarFeriado, getFeriados } = require('../controllers/calendarController');
const auth = require('../middleware/authMiddleware');

router.get('/mis-turnos', auth, getUserSelections);
router.post('/asignar-turnos', auth, setUserSelections);
router.get('/turnos', auth, getAllTurnosPorHorario);
router.put('/admin-mover-usuario', auth ,adminMoverUsuario);
router.post('/feriado', auth, marcarFeriado);
router.get('/feriados', auth, getFeriados);

module.exports = router;