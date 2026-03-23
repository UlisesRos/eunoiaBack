const mongoose = require('mongoose');

// Registra horarios cerrados puntualmente en una fecha específica.
// Ejemplo: { date: '2024-03-21', hour: '08:00' } → ese horario está cerrado ese día.
const closedSlotSchema = new mongoose.Schema({
    date: {
        type: String,
        required: true  // ISO 'YYYY-MM-DD'
    },
    hour: {
        type: String,
        required: true  // 'HH:MM'
    }
});

// Índice compuesto: no puede haber dos registros con la misma fecha+hora
closedSlotSchema.index({ date: 1, hour: 1 }, { unique: true });

module.exports = mongoose.model('ClosedSlot', closedSlotSchema);
