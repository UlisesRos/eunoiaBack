const mongoose = require('mongoose');

const userSelectionSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true },

    // Selecciones permanentes
    originalSelections: [
        {
            day: { type: String, required: true },
            hour: { type: String, required: true }
        }
    ],

    // Cambios temporales (por semana)
    temporarySelections: {
        type: [
            {
                day: { type: String, required: true },
                hour: { type: String, required: true }
            }
        ],
        default: []
},
    changesThisMonth: { type: Number, default: 0 },
    lastChange: { type: Date, default: null },
});

module.exports = mongoose.model('UserSelection', userSelectionSchema);

