const nodemailer = require('nodemailer');

const sendEmail = async (to, subject, text) => {
    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail', // Podés cambiar esto según el proveedor que uses
            auth: {
                user: process.env.EMAIL_USER, // tu correo
                pass: process.env.EMAIL_PASS  // tu contraseña o app password
            }
        });

        await transporter.sendMail({
            from: `"Estudio de Pilates - Eunoia" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            text
        });

        console.log('Correo enviado a:', to);
    } catch (error) {
        console.error('Error al enviar correo:', error);
    }
};

module.exports = sendEmail;
