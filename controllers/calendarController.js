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
        const userSelection = await UserSelection.findOne({ user: userId });

        if (!userSelection) {
            return res.json({ selections: [] });
        }

        const selectionsToShow = userSelection.temporarySelections.length > 0
            ? userSelection.temporarySelections
            : userSelection.originalSelections;

        return res.json({
            selections: selectionsToShow,
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
        const { selections } = req.body;

        if (!Array.isArray(selections) || selections.length === 0) {
            return res.status(400).json({ message: 'Debe enviar al menos un día y horario.' });
        }

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'Usuario no encontrado.' });

        const maxDias = user.diasSemanales;
        if (selections.length !== maxDias) {
            return res.status(400).json({ message: `Debe seleccionar exactamente ${maxDias} días.` });
        }

        const diasElegidos = new Set();
        for (const sel of selections) {
            if (diasElegidos.has(sel.day)) {
                return res.status(400).json({
                    message: `No puede seleccionar más de un horario el mismo día (${sel.day}).`
                });
            }
            diasElegidos.add(sel.day);
        }

        const countPromises = selections.map(sel =>
            UserSelection.countDocuments({
                user: { $ne: userId },
                $or: [
                    { 'originalSelections': { $elemMatch: sel } },
                    { 'temporarySelections': { $elemMatch: sel } }
                ]
            })
        );

        const counts = await Promise.all(countPromises);
        console.log(counts)
        for (let i = 0; i < counts.length; i++) {
            if (counts[i] >= 7) {
                return res.status(400).json({
                    message: `El turno ${selections[i].day} ${selections[i].hour} ya está completo.`
                });
            }
        }

        let userSelection = await UserSelection.findOne({ user: userId });
        const now = new Date();

        if (!userSelection) {
            // Primera vez: guardamos como selección original
            userSelection = new UserSelection({
                user: userId,
                originalSelections: selections,
                temporarySelections: [],
                changesThisMonth: 0,
                lastChange: now
            });
            await userSelection.save();
            return res.json({ message: 'Selección guardada correctamente.' });
        }

        // Si ya tiene selección original → cambio temporal
        if (userSelection.lastChange && sameMonth(now, userSelection.lastChange)) {
            if (userSelection.changesThisMonth >= 2) {
                return res.status(403).json({ message: 'Ya alcanzó el límite de 2 cambios para este mes.' });
            }
            userSelection.changesThisMonth += 1;
        } else {
            userSelection.changesThisMonth = 1; // Nuevo mes
        }

        userSelection.temporarySelections = selections;
        userSelection.lastChange = now;

        await userSelection.save();
        return res.json({ message: 'Cambio temporal aplicado correctamente.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al guardar la selección.' });
    }
};


// Ver todos los turnos por horarios.
const getAllTurnosPorHorario = async (req, res) => {
    try {
        const allSelections = await UserSelection.find().populate('user', 'nombre apellido');
    
        const turnosMap = {};
    
        allSelections.forEach(sel => {
            // Usar temporarySelections si hay cambios esta semana, sino usar originalSelections
            const selections = (sel.temporarySelections && sel.temporarySelections.length > 0)
                ? sel.temporarySelections
                : (sel.originalSelections || []);



            selections.forEach(({ day, hour }) => {
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
