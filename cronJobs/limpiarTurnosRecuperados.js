const cron = require('node-cron');
const RecoverableTurn = require('../models/RecoverableTurn');

function limpiarTurnosRecuperados() {
    const hoy = new Date();
    const primerDiaDelMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);

    RecoverableTurn.deleteMany({
        recovered: true,
        recoveryDate: { $lt: primerDiaDelMes }
    })
    .then(result => {
        console.log(`[Cron] 🧹 Turnos recuperados antiguos eliminados: ${result.deletedCount}`);
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
