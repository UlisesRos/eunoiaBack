const cron = require('node-cron');
const sendEmail = require('./sendEmail');
const User = require('../models/User');

const recordatorioPago = async () => {
    // Ejecutar cada mes el día 11 a las 9:00 AM
    cron.schedule('0 9 11 * *', async () => {
        try {
            console.log('Buscando usuarios que no pagaron...');

            const usuariosMorosos = await User.find({ pago: false });

            for (const user of usuariosMorosos) {
                if(user.rol === 'admin') {
                    continue; // No enviar recordatorio a administradores
                }

                await sendEmail(
                    user.email,
                    'Recordatorio de pago. Eunoia Pilates',
                    `Hola ${user.nombre}, te recordamos que aún no registramos el pago de tu cuota mensual. Por favor, regularizá tu situación lo antes posible. Muchas Gracas!.`
                );
            }

            console.log(`Se enviaron correos a ${usuariosMorosos.length} usuarios.`);
        } catch (err) {
            console.error('Error al enviar recordatorios:', err);
        }
    });
}

module.exports = recordatorioPago;
