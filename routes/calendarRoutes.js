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
        limpiarTurnosRecuperadosViejos,
        setOriginalSelections,
        listarTodosLosTurnosRecuperadosUsados,
        adminResetToOriginals,
        adminEliminarTurnoRecuperado,
        usuarioEliminarTurnoRecuperado,
        getSchedule,
        addHour,
        removeHour,
        getClosedSlots,
        cerrarHorario,
        abrirHorario,
    } = require('../controllers/calendarController');
const auth = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

// Rutas de usuario
router.get('/mis-turnos', auth, getUserSelections);
router.post('/asignar-turnos', auth, setUserSelections);
router.get('/turnos', auth, getAllTurnosPorHorario);
router.post('/reset-temporales', auth, resetUserSelections);
router.post('/cancelar-temporalmente', auth, eliminarTurnoPorEstaSemana);
router.get('/feriados', auth, getFeriados);
router.post('/guardar-para-recuperar', auth, guardarTurnoParaRecuperar);
router.get('/turnos-recuperables', auth, listarTurnosRecuperables);
router.post('/usar-turno-recuperado', auth, usarTurnoRecuperado);
router.get('/turnos-recuperados-usados', auth, listarTurnosRecuperadosUsados);
router.get('/turnos-recuperados-todos', auth, listarTodosLosTurnosRecuperadosUsados);
router.post('/usuario-eliminar-turno-recuperado', auth, usuarioEliminarTurnoRecuperado);
router.get('/schedule', auth, getSchedule);
router.get('/closed-slots', auth, getClosedSlots);

// Rutas exclusivas de admin
router.put('/admin-mover-usuario', auth, adminMiddleware, adminMoverUsuario);
router.post('/admin-reset-a-originales', auth, adminMiddleware, adminResetToOriginals);
router.post('/admin-cancelar-temporalmente', auth, adminMiddleware, adminCancelarTurnoTemporalmente);
router.post('/feriado', auth, adminMiddleware, marcarFeriado);
router.post('/quitar-feriado', auth, adminMiddleware, quitarFeriado);
router.post('/limpiar-turnos-recuperados-viejos', auth, adminMiddleware, limpiarTurnosRecuperadosViejos);
router.post('/admin-eliminar-turno-recuperado', auth, adminMiddleware, adminEliminarTurnoRecuperado);
router.post('/set-original-selections', auth, adminMiddleware, setOriginalSelections);
router.post('/schedule/add-hour', auth, adminMiddleware, addHour);
router.post('/schedule/remove-hour', auth, adminMiddleware, removeHour);
router.post('/closed-slot', auth, adminMiddleware, cerrarHorario);
router.post('/open-slot', auth, adminMiddleware, abrirHorario);

module.exports = router;