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

        // Buscar si ya tiene selección guardada
        let userSelection = await UserSelection.findOne({ user: userId });

        let countPromises;

        if (!userSelection) {
            // Primer registro → verificar SOLO originalSelections (ocupación fija)
            countPromises = selections.map(async sel => {
                const count = await UserSelection.countDocuments({
                    user: { $ne: userId },
                    originalSelections: { $elemMatch: sel }
                });

                return count;
            });
        } else {
            // Cambio temporal → verificar lo que se está usando efectivamente en la semana
            countPromises = selections.map(async sel => {
                const usuariosOcupando = await UserSelection.find({
                    user: { $ne: userId }
                });

                const count = usuariosOcupando.filter(u => {
                    const useTemporary = u.temporarySelections?.length > 0;
                    const selections = useTemporary ? u.temporarySelections : u.originalSelections;

                    return selections.some(t => t.day === sel.day && t.hour === sel.hour);
                }).length;

                return count;
            });
        }

        const counts = await Promise.all(countPromises);

        for (let i = 0; i < counts.length; i++) {
            if (counts[i] >= 7) {
                return res.status(400).json({
                    message: `El turno ${selections[i].day} ${selections[i].hour} ya está completo.`
                });
            }
        }

        const now = new Date();

        if (!userSelection) {
            // Primer registro
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

        // Cambio temporal
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
            const { originalSelections = [], temporarySelections = [] } = sel;
            const usarTemporales = temporarySelections.length > 0;
            const source = usarTemporales ? temporarySelections : originalSelections;

            source.forEach(({ day, hour }) => {
                const key = `${day}-${hour}`;
                if (!turnosMap[key]) {
                    turnosMap[key] = [];
                }

                let tipo = 'original';

                if (usarTemporales) {
                    const esOriginal = originalSelections.some(
                        o => o.day === day && o.hour === hour
                    );
                    if (!esOriginal) {
                        tipo = 'temporal';
                    }
                }

                turnosMap[key].push({
                    nombre: `${sel.user.nombre} ${sel.user.apellido}`,
                    tipo
                });
            });
        });

        const result = Object.entries(turnosMap).map(([key, users]) => {
            const [day, hour] = key.split('-');
            return { day, hour, users };
        });

        res.json(result);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener los turnos.' });
    }
};

const adminMoverUsuario = async (req, res) => {
    try {
        const { userFullName, current, newTurn, type } = req.body;

        // Solo permitimos tipo 'original'
        if (type !== 'original') {
            return res.status(400).json({ message: 'Solo se pueden cambiar turnos permanentes (originales).' });
        }

        if (!userFullName || !current || !newTurn) {
            return res.status(400).json({ message: 'Faltan datos requeridos.' });
        }

        // Limpiamos espacios extra al dividir nombre y apellido
        const partes = userFullName.trim().split(' ').filter(Boolean);
        const apellido = partes.pop().trim();
        const nombre = partes.join(' ').trim();

        // Buscamos usuario con nombre y apellido limpios
        const user = await User.findOne({ nombre, apellido });
        if (!user) return res.status(404).json({ message: 'Usuario no encontrado.' });

        const userSelection = await UserSelection.findOne({ user: user._id });
        if (!userSelection) return res.status(404).json({ message: 'El usuario no tiene turnos asignados.' });

        // Solo trabajamos con originalSelections
        if (!userSelection.originalSelections) userSelection.originalSelections = [];

        // 1. Eliminar el turno actual de originalSelections
        userSelection.originalSelections = userSelection.originalSelections.filter(
            t => !(t.day === current.day && t.hour === current.hour)
        );

        // 2. No eliminamos de temporarySelections ni tocamos turnos temporales

        // 3. Agregar el nuevo turno si no existe
        const yaExiste = userSelection.originalSelections.some(
            t => t.day === newTurn.day && t.hour === newTurn.hour
        );
        if (!yaExiste) {
            userSelection.originalSelections.push({ day: newTurn.day, hour: newTurn.hour });
        }

        // 4. No actualizamos metadata para temporales porque ya no aplican cambios temporales

        await userSelection.save();
        return res.json({ message: 'Cambio realizado correctamente.' });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Error al mover el usuario.' });
    }
};




module.exports = {
    getUserSelections,
    setUserSelections,
    getAllTurnosPorHorario,
    adminMoverUsuario
};
