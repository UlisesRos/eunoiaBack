const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sendEmail = require('../utils/sendEmail');
const validator = require('validator');
const crypto = require('crypto');

// REGISTER
const register = async (req, res) => {
    try {
        const nombre = req.body.nombre.toLowerCase().trim();
        const apellido = req.body.apellido.toLowerCase().trim();
        const email = req.body.email.toLowerCase().trim();

        const { celular, diasSemanales, password, confirmarPassword } = req.body;

        // Condicional para celulares
        if (!/^\d+$/.test(celular)) {
            return res.status(400).json({ message: 'El celular debe contener solo números' });
        }

        // Validar campos vacíos
        if (!nombre || !apellido || !email || !celular || !diasSemanales || !password || !confirmarPassword) {
            return res.status(400).json({ message: 'Todos los campos son obligatorios.' });
        }

        // Validar formato de email
        if (!validator.isEmail(email)) {
            return res.status(400).json({ field: 'email', message: 'El email no es válido.' });
        }

        // Validar coincidencia de contraseñas
        if (password !== confirmarPassword) {
            return res.status(400).json({ field: 'confirmarPassword', message: 'Las contraseñas no coinciden.' });
        }

        // Validar formato de contraseña
        const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
        if (!passwordRegex.test(password)) {
            return res.status(400).json({
                field: 'password',
                message: 'La contraseña debe tener al menos 8 caracteres, una mayúscula y un número.'
            });
        }

        // Verificar si el usuario ya existe
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ field: 'email', message: 'El usuario ya está registrado.' });
        }

        // Encriptar contraseña
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            nombre,
            apellido,
            email,
            celular,
            diasSemanales,
            password: hashedPassword
        });

        await newUser.save();

        // Enviar correo de bienvenida
        await sendEmail(email, 'Registro exitoso', `Hola ${nombre}, te registraste correctamente en el estudio de pilates.`);

        // Generar token JWT
        const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, { expiresIn: '1d' });

        res.status(201).json({
            message: 'Usuario registrado correctamente.',
            token
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error en el servidor.' });
    }
};

//LOGIN

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validación básica
        if (!email || !password) {
            return res.status(400).json({ message: 'Todos los campos son obligatorios.' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'El usuario no existe.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Contraseña incorrecta.' });
        }

        // Crear token
        const token = jwt.sign(
            { id: user._id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.status(200).json({
            message: 'Inicio de sesión exitoso.',
            token,
            user: {
                id: user._id,
                nombre: user.nombre,
                apellido: user.apellido,
                email: user.email,
                celular: user.celular,
                diasSemanales: user.diasSemanales,
                pago: user.pago,
                rol: user.rol
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error en el servidor.' });
    }
};

// Obtener todos los usuarios
const getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password'); // sin contraseña
        res.json(users);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener los usuarios.' });
    }
};

// Olvidé mi contraseña
const forgotPassword = async (req, res) => {
    const { email } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'No se encontró un usuario con ese email.' });
        }

        // Generar token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

        // Guardar en el usuario
        user.resetPasswordToken = hashedToken;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hora
        await user.save();

        const resetURL = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

        await sendEmail(
            email,
            'Recuperación de contraseña',
            `Hola ${user.nombre}, haz clic en el siguiente enlace para restablecer tu contraseña:\n\n${resetURL}`
        );

        res.json({ message: 'Se ha enviado un correo con el enlace para restablecer la contraseña.' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al enviar el email de recuperación.' });
    }
};

// Restablecer contraseña
const resetPassword = async (req, res) => {
    const { token } = req.params;
    const { password, confirmarPassword } = req.body;

    if (password !== confirmarPassword) {
        return res.status(400).json({ message: 'Las contraseñas no coinciden.' });
    }

     // Validar formato de contraseña
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(password)) {
        return res.status(400).json({
            field: 'password',
            message: 'La contraseña debe tener al menos 8 caracteres, una mayúscula y un número.'
        });
    }

    try {
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        const user = await User.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: 'El token es inválido o ha expirado.' });
        }

        // Encriptar nueva contraseña
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

        await user.save();

        res.json({ message: 'Contraseña actualizada correctamente.' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al restablecer la contraseña.' });
    }
};


module.exports = {
    register,
    login,
    getAllUsers,
    forgotPassword,
    resetPassword
}

