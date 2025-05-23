// controllers/calendarController.js
const UserSelection = require('../models/UserSelection');
const User = require('../models/User'); // Para consultar diasSemanales del usuario

// Helper para saber si estamos en el mismo mes/año
function sameMonth(date1, date2) {
    return (
        date1.getMonth() === date2.getMonth() &&
        date1.getFullYear() === date2.getFullYear()
    );
}

// Obtener los días/horarios que tiene asignado el usuario
const getUserSelections = async (req, res) => {
    try {
        const userId = req.user.id;

        let userSelection = await UserSelection.findOne({ user: userId });
        if (!userSelection) {
        // Si no tiene selección creada, devolver array vacío
        return res.json({ selections: [] });
        }

        return res.json({ 
            selections: userSelection.selections,
            changesThisMonth: userSelection.changesThisMonth || 0
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener las selecciones.' });
    }
};

// Asignar o modificar los días/horarios de entrenamiento del usuario
const setUserSelections = async (req, res) => {
    try {
        const userId = req.user.id;
        const { selections } = req.body; // [{ day: "Lunes", hour: "08:00" }, ...]

        // Validar estructura básica
        if (!Array.isArray(selections) || selections.length === 0) {
            return res.status(400).json({ message: 'Debe enviar al menos un día y horario.' });
        }

        // Obtener info del usuario para saber cuántos días puede elegir
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'Usuario no encontrado.' });

        const maxDias = user.diasSemanales;
        if (selections.length > maxDias) {
            return res.status(400).json({ message: `Solo puede seleccionar hasta ${maxDias} días.` });
        }

        if (selections.length < maxDias) {
            return res.status(400).json({ message: `Debe seleccionar ${maxDias} días.` });
        }

        // Validar que no haya más de un horario el mismo día
        const diasElegidos = new Set();
        for (const sel of selections) {
            if (diasElegidos.has(sel.day)) {
                return res.status(400).json({
                    message: `No puede seleccionar más de un horario el mismo día (${sel.day}).`
                });
            }
            diasElegidos.add(sel.day);
        }

        // Validar cupo por cada día y hora (máximo 7 personas por turno)
        const userSelect = await UserSelection.findOne({ user: userId });

        for (const sel of selections) {
            // Verificamos si el usuario ya tenía este turno asignado
            const yaEstabaInscripto = userSelect?.selections?.some(
                s => s.day === sel.day && s.hour === sel.hour
            );

            const count = await UserSelection.countDocuments({
                selections: { $elemMatch: { day: sel.day, hour: sel.hour } }
            });

            const capacidadMaxima = 7;

            if (!yaEstabaInscripto && count >= capacidadMaxima) {
                return res.status(400).json({
                message: `El turno ${sel.day} ${sel.hour} ya está completo.`
                });
            }
        }

        // Buscar selección previa
        let userSelection = await UserSelection.findOne({ user: userId });
        const now = new Date();

        if (!userSelection) {
            // No tiene selección previa, crear nueva
            userSelection = new UserSelection({
                user: userId,
                selections,
                changesThisMonth: 0,
                lastChange: now
            });
            await userSelection.save();
            return res.json({ message: 'Selección guardada correctamente.' });
        }

        // Validar límite de cambios (máximo 2 por mes)
        if (userSelection.lastChange && sameMonth(now, userSelection.lastChange)) {
            if (userSelection.changesThisMonth >= 2) {
                return res.status(403).json({
                    message: 'Ya alcanzó el límite de 2 cambios para este mes.'
                });
            }
            // Incrementar contador de cambios del mes actual
            userSelection.changesThisMonth += 1;
        } else {
            // Nuevo mes, resetear contador
            userSelection.changesThisMonth = 0;
        }

        // Actualizar selección y fecha de último cambio
        userSelection.selections = selections;
        userSelection.lastChange = now;

        await userSelection.save();

        return res.json({ message: 'Selección actualizada correctamente.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al guardar las selecciones.' });
    }
};


// Ver todos los turnos por horarios.
const getAllTurnosPorHorario = async (req, res) => {
    try {
        const allSelections = await UserSelection.find().populate('user', 'nombre apellido');
    
        const turnosMap = {};
    
        allSelections.forEach(sel => {
            sel.selections.forEach(({ day, hour }) => {
                const key = `${day}-${hour}`;
                if (!turnosMap[key]) {
                    turnosMap[key] = [];
                }
                turnosMap[key].push(`${sel.user.nombre} ${sel.user.apellido}`);
            });
        });
    
        const result = Object.entries(turnosMap).map(([key, users]) => {
            const [day, hour] = key.split('-');
            return { day, hour, users};
        });

        res.json(result);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener los turnos.'});
    };
};

module.exports = {
    getUserSelections,
    setUserSelections,
    getAllTurnosPorHorario
};
