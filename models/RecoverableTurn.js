const mongoose = require('mongoose');

const recoverableTurnSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    originalDay: { type: String, required: true },
    originalHour: { type: String, required: true },
    cancelledWeek: { type: Date, required: true },
    recovered: { type: Boolean, default: false },
    recoveryDate: { type: Date, default: null },
    assignedDay: { type: String, default: null }, 
    assignedHour: { type: String, default: null } 
});

module.exports = mongoose.model('RecoverableTurn', recoverableTurnSchema);
