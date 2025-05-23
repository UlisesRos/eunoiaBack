const cron = require('node-cron');
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

module.exports = resetCambioMensual;


