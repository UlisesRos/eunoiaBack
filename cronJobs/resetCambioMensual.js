const express = require("express");
const router = express.Router();
const UserSelection = require("../models/UserSelection");
const User = require("../models/User");

// 🔄 Reinicio mensual (día 1 de cada mes)
router.get("/reset-mensual", async (req, res) => {
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

// 🔄 Reinicio semanal (sábado)
router.get("/reset-semanal", async (req, res) => {
    try {
        await UserSelection.updateMany({}, {
            $unset: { temporarySelections: "" } // o $set: { temporarySelections: [] }
        });

        res.json({ ok: true, msg: "Reinicio semanal completado" });
    } catch (err) {
        console.error("Error en reset semanal:", err);
        res.status(500).json({ ok: false, msg: "Error en reset semanal" });
    }
});

module.exports = router;


/*const cron = require('node-cron');
const UserSelection = require('../models/UserSelection');
const User = require('../models/User'); // Asegurate de importar el modelo correcto

const resetCambioMensual = async () => {
    // ✅ Reiniciar cambios mensuales
    cron.schedule('0 0 1 * *', async () => {
        try {
            console.log('[CRON] Reiniciando cambios mensuales...');
            await UserSelection.updateMany({}, {
                $set: {
                    changesThisMonth: 0,
                    lastChange: null
                }
            });
            console.log('[CRON] Cambios mensuales reiniciados correctamente.');
        } catch (error) {
            console.error('[CRON] Error al reiniciar los cambios mensuales:', error);
        }
    });

    // ✅ Reiniciar el estado de pago
    cron.schedule('0 0 1 * *', async () => {
        try {
            console.log('[CRON] Reiniciando estado de pago...');
            await User.updateMany({}, { $set: { pago: false } });
            console.log('[CRON] Estado de pago reiniciado correctamente.');
        } catch (error) {
            console.error('[CRON] Error al reiniciar estado de pago:', error);
        }
    });
};


const resetCambiosSemanales = () => {
    // ✅ Reiniciar cambios semanales
    // Cada sábado a las 15:00
    cron.schedule('0 7 * * 6', async ()=> {
    console.log('[CRON] Reiniciando cambios semanales (temporalSelections)');

    try {
        // Limpiar cambios temporales (reemplaza "temporarySelections" por el campo que usás)
        await UserSelection.updateMany({}, {
            $unset: { temporarySelections: "" }  // o $set: { temporarySelections: [] } si es array
        });

        console.log('[CRON] Cambios temporales reseteados correctamente.');
    } catch (error) {
        console.error('[CRON] Error al reiniciar cambios semanales:', error);
    }
    }, {
        timezone: 'America/Argentina/Buenos_Aires'
    });
    
};

module.exports = { resetCambioMensual, resetCambiosSemanales };*/


