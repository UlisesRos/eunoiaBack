const express = require('express');
const router = express.Router();
const { register, login, getAllUsers, forgotPassword, resetPassword } = require('../controllers/authController');

// Ruta para registrar usuarios
router.post('/register', register);

// Ruta para iniciar sesión
router.post('/login', login);

// Ruta para obtener todos los usuarios
router.get('/users', getAllUsers);

// Olvide contraseña
router.post('/forgot-password', forgotPassword);

// Ruta para restablecer contraseña
router.post('/reset-password/:token', resetPassword);

module.exports = router;
