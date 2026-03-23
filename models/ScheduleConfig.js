const mongoose = require('mongoose');

// Almacena los horarios permanentes de cada día de la semana.
// Un documento por día: { day: 'lunes', hours: ['08:00', '09:00', ...] }
const scheduleConfigSchema = new mongoose.Schema({
    day: {
        type: String,
        required: true,
        unique: true,
        enum: ['lunes', 'martes', 'miércoles', 'jueves', 'viernes']
    },
    hours: {
        type: [String],
        default: []
    }
});

module.exports = mongoose.model('ScheduleConfig', scheduleConfigSchema);
