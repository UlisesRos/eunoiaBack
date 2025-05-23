const cron = require('node-cron');
const sendEmail = require('./sendEmail');
const User = require('../models/User');

const recordatorioPago = async () => {
    // Recordatorio a usuarios morosos el día 11 a las 9:00 AM
    cron.schedule('0 9 11 * *', async () => {
        try {
            console.log('Buscando usuarios que no pagaron para enviar recordatorios...');

            const usuariosMorosos = await User.find({ pago: false });

            for (const user of usuariosMorosos) {
                if (user.rol === 'admin') continue;

                await sendEmail(
                    user.email,
                    'Recordatorio de pago - Eunoia Pilates',
                    `Hola ${user.nombre}, te recordamos que aún no registramos el pago de tu cuota mensual. Por favor, regularizá tu situación lo antes posible. ¡Muchas gracias!`
                );
            }

            console.log(`Se enviaron recordatorios a ${usuariosMorosos.length} usuarios.`);
        } catch (err) {
            console.error('Error al enviar recordatorios:', err);
        }
    });

    // Envío de resumen a administradora el día 25 a las 9:00 AM
    cron.schedule('0 9 25 * *', async () => {
        try {
            console.log('Generando informe de usuarios morosos para administración...');

            const usuariosMorosos = await User.find({ pago: false });

            const lista = usuariosMorosos
                .filter(user => user.rol !== 'admin')
                .map(user => `- ${user.nombre} (${user.email})`)
                .join('\n');

            const cuerpoMensaje = usuariosMorosos.length
                ? `Usuarios que no han pagado este mes:\n\n${lista}`
                : 'Todos los usuarios han pagado este mes.';

            await sendEmail(
                'ornelnob93@gmail.com',
                'Informe de usuarios morosos - Eunoia Pilates',
                cuerpoMensaje
            );

            console.log('Informe mensual enviado a la administración.');
        } catch (err) {
            console.error('Error al enviar informe mensual:', err);
        }
    });
};

module.exports = recordatorioPago;

