const express = require('express');
const router = express.Router();
const { 
        getUserSelections, 
        setUserSelections, 
        adminMoverUsuario, 
        getAllTurnosPorHorario, 
        marcarFeriado, 
        getFeriados,
        quitarFeriado, 
        resetUserSelections, 
        eliminarTurnoPorEstaSemana, 
        guardarTurnoParaRecuperar, 
        listarTurnosRecuperables, 
        usarTurnoRecuperado, 
        adminCancelarTurnoTemporalmente,
        listarTurnosRecuperadosUsados,
        limpiarTurnosRecuperadosViejos
    } = require('../controllers/calendarController');
const auth = require('../middleware/authMiddleware');

router.get('/mis-turnos', auth, getUserSelections);
router.post('/asignar-turnos', auth, setUserSelections);
router.get('/turnos', auth, getAllTurnosPorHorario);
router.put('/admin-mover-usuario', auth ,adminMoverUsuario);
router.post('/admin-cancelar-temporalmente', auth, adminCancelarTurnoTemporalmente);
router.post('/reset-temporales', auth, resetUserSelections)
router.post('/cancelar-temporalmente', auth, eliminarTurnoPorEstaSemana);
router.post('/feriado', auth, marcarFeriado);
router.get('/feriados', auth, getFeriados);
router.post('/quitar-feriado', auth, quitarFeriado);
router.post('/guardar-para-recuperar', auth, guardarTurnoParaRecuperar);
router.get('/turnos-recuperables', auth, listarTurnosRecuperables);
router.post('/usar-turno-recuperado', auth, usarTurnoRecuperado);
router.get('/turnos-recuperados-usados', auth, listarTurnosRecuperadosUsados);
router.post('/limpiar-turnos-recuperados-viejos', auth, limpiarTurnosRecuperadosViejos); 

module.exports = router;