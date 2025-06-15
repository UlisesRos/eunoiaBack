const fs = require('fs');
const path = require('path');
const hiddenTurnsPath = path.join(__dirname, '../data/hiddenTurns.json');

const ocultarTurnoTemporalmente = async (req, res) => {
    try {
        const userId = req.user.id;
        const { day, hour } = req.body;

        if (!day || !hour) {
            return res.status(400).json({ message: 'Faltan parámetros: day y hour son requeridos.' });
        }

        const hiddenData = JSON.parse(fs.readFileSync(hiddenTurnsPath, 'utf8') || '{}');

        if (!hiddenData[userId]) hiddenData[userId] = [];

        const yaOculto = hiddenData[userId].some(t => t.day === day && t.hour === hour);
        if (!yaOculto) {
            hiddenData[userId].push({ day, hour });
            fs.writeFileSync(hiddenTurnsPath, JSON.stringify(hiddenData, null, 2));
        }

        return res.json({ message: 'Turno ocultado temporalmente hasta el sábado.' });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Error al ocultar turno.' });
    }
};

module.exports = {
    ocultarTurnoTemporalmente
};
