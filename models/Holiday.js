const mongoose = require('mongoose');

const holidaySchema = new mongoose.Schema({
    date: {
        type: String,
        required: true,
        unique: true
    },
    description: {
        type: String,
        default: 'Feriado'
    }
});

module.exports = mongoose.model('Holiday', holidaySchema);