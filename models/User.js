const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    nombre: {
        type: String,
        required: true,
    },
    apellido: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    celular: {
        type: String,
        required: true,
    },
    diasSemanales: {
        type: Number,
        enum: [1, 2, 3],
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    pago: {
        type: Boolean,
        default: false,
    },
    fechaRegistro: {
        type: Date,
        default: Date.now,
    },
    fechaPago: {
        type: Date,
        default: null,
    },
    rol: {
        type: String,
        enum: ['usuario', 'admin'],
        default: 'usuario'
    },
    resetPasswordToken: {
        type: String
    },
    resetPasswordExpires: {
        type: Date
    },
});

module.exports = mongoose.model('User', userSchema);
