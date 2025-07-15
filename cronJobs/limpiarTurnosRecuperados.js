const cron = require('node-cron');
const RecoverableTurn = require('../models/RecoverableTurn');

function limpiarTurnosRecuperados() {
    const haceUnMes = new Date();
    haceUnMes.setMonth(haceUnMes.getMonth() - 1);

    RecoverableTurn.deleteMany({
        recovered: true,
        recoveryDate: { $lt: haceUnMes }
    })
    .then(result => {
        console.log(`[Cron] 🧹 Turnos recuperados anteriores a ${haceUnMes.toISOString().slice(0, 10)} eliminados: ${result.deletedCount}`);
    })
    .catch(err => {
        console.error('[Cron] ❌ Error al eliminar turnos viejos:', err);
    });
}

// Ejecutar todos los días a las 02:00 AM
cron.schedule('0 2 * * *', () => {
    limpiarTurnosRecuperados();
});

module.exports = limpiarTurnosRecuperados;

