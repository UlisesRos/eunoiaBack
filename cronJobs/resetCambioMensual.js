const express = require("express");
const router = express.Router();
const cron = require('node-cron');
const UserSelection = require("../models/UserSelection");
const User = require("../models/User");
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

// =============================================
// CRON JOBS AUTOMATICOS
// =============================================

// Reinicio mensual: día 1 de cada mes a las 00:00
cron.schedule('0 0 1 * *', async () => {
    try {
        console.log('[CRON] Reiniciando cambios mensuales y estado de pago...');
        await UserSelection.updateMany({}, {
            $set: { changesThisMonth: 0, lastChange: null }
        });
        await User.updateMany({}, { $set: { pago: false } });
        console.log('[CRON] Reinicio mensual completado correctamente.');
    } catch (error) {
        console.error('[CRON] Error en reinicio mensual:', error);
    }
}, { timezone: 'America/Argentina/Buenos_Aires' });

// Reinicio semanal: cada sábado a las 03:00 (Argentina)
// Se limpia al inicio del sábado para que el calendario ya aparezca "fresco"
// con los turnos originales. Así los usuarios tienen todo el sábado y domingo
// para ver y modificar sus turnos para la semana siguiente (lunes a viernes).
cron.schedule('0 3 * * 6', async () => {
    try {
        console.log('[CRON] Reiniciando selecciones temporales semanales...');
        await UserSelection.updateMany({}, {
            $set: { temporarySelections: [] }
        });
        console.log('[CRON] Reinicio semanal de temporarySelections completado.');
    } catch (error) {
        console.error('[CRON] Error en reinicio semanal:', error);
    }
}, { timezone: 'America/Argentina/Buenos_Aires' });

// =============================================
// RUTAS MANUALES (solo admin, para uso de emergencia)
// =============================================

// Reinicio mensual manual
router.post("/reset-mensual", authMiddleware, adminMiddleware, async (req, res) => {
    try {
        await UserSelection.updateMany({}, {
            $set: { changesThisMonth: 0, lastChange: null }
        });
        await User.updateMany({}, { $set: { pago: false } });

        res.json({ ok: true, msg: "Reinicio mensual completado" });
    } catch (err) {
        console.error("Error en reset mensual:", err);
        res.status(500).json({ ok: false, msg: "Error en reset mensual" });
    }
});

// Reinicio semanal manual
router.post("/reset-semanal", authMiddleware, adminMiddleware, async (req, res) => {
    try {
        await UserSelection.updateMany({}, {
            $set: { temporarySelections: [] }
        });

        res.json({ ok: true, msg: "Reinicio semanal completado" });
    } catch (err) {
        console.error("Error en reset semanal:", err);
        res.status(500).json({ ok: false, msg: "Error en reset semanal" });
    }
});

module.exports = router;
