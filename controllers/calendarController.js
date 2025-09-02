// controllers/calendarController.js
const UserSelection = require('../models/UserSelection');
const User = require('../models/User'); // Para consultar diasSemanales del usuario
const Holiday = require('../models/Holiday'); // Para consultar feriados
const RecoverableTurn = require('../models/RecoverableTurn'); // Para manejar turnos recuperables

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
            originalSelections: userSelection.originalSelections || [],
            changesThisMonth: userSelection.changesThisMonth || 0
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener las selecciones.' });
    }
};


// Guardar las selecciones del usuario
const setUserSelections = async (req, res) => {
    try {
        const userId = req.user.id;
        const { selections } = req.body;

        if (!Array.isArray(selections)) {
            return res.status(400).json({ message: 'Formato inválido.' });
        }

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'Usuario no encontrado.' });

        
        const maxDias = user.diasSemanales;
        let userSelection = await UserSelection.findOne({ user: userId });
        
        const now = new Date();

        // Validar bloqueo por falta de pago
        const hoy = new Date();
        if (!user.pago && hoy.getDate() > 10 && userSelection) {
            return res.status(403).json({ message: 'Debés realizar tu pago correspondiente para cambiar o recuperar turnos.' });
        }

        // Primer registro (original)
        if (!userSelection) {
            if (selections.length !== maxDias) {
                return res.status(400).json({ message: `Debés seleccionar exactamente ${maxDias} días.` });
            }

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

        // Validar que no excedan la ocupación
        const countPromises = selections.map(async sel => {
            const usuariosOcupando = await UserSelection.find({ user: { $ne: userId } });

            const count = usuariosOcupando.filter(u => {
                const usarTemp = u.temporarySelections?.length > 0;
                const turnos = usarTemp ? u.temporarySelections : u.originalSelections;
                return turnos.some(t => t.day === sel.day && t.hour === sel.hour);
            }).length;

            return count;
        });

        const counts = await Promise.all(countPromises);
        for (let i = 0; i < counts.length; i++) {
            if (counts[i] >= 7) {
                return res.status(400).json({
                    message: `El turno ${selections[i].day} ${selections[i].hour} ya está completo.`
                });
            }
        }

        // Aplicar cambio temporal
        if (userSelection.lastChange && sameMonth(now, userSelection.lastChange)) {
            if (userSelection.changesThisMonth >= 2) {
                return res.status(403).json({ message: 'Ya alcanzaste el límite de 2 cambios este mes.' });
            }
            userSelection.changesThisMonth += 1;
        } else {
            userSelection.changesThisMonth = 1;
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

const setOriginalSelections = async (req, res) => {
    try {
        const userId = req.user.id;
        const { selections } = req.body;

        if (!Array.isArray(selections)) {
            return res.status(400).json({ message: 'Formato inválido.' });
        }

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'Usuario no encontrado.' });

        const maxDias = user.diasSemanales;
        if (selections.length !== maxDias) {
            return res.status(400).json({ message: `Debés seleccionar exactamente ${maxDias} días.` });
        }

        const userSelection = await UserSelection.findOne({ user: userId });
        if (!userSelection) {
            // Si no existía, lo creamos
            const nuevo = new UserSelection({
                user: userId,
                originalSelections: selections,
                temporarySelections: [],
                changesThisMonth: 0
            });
            await nuevo.save();
            return res.json({ message: 'Turnos originales guardados correctamente.' });
        }

        userSelection.originalSelections = selections;
        await userSelection.save();
        return res.json({ message: 'Turnos originales actualizados correctamente.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error al guardar los turnos originales.' });
    }
};


// Eliminar un turno por esta semana
const eliminarTurnoPorEstaSemana = async (req, res) => {
    try {
        const userId = req.user.id;
        const { day, hour } = req.body;

        if (!day || !hour) {
            return res.status(400).json({ message: 'Falta día u hora.' });
        }

        const userSelection = await UserSelection.findOne({ user: userId });
        if (!userSelection) {
            return res.status(400).json({ message: 'No hay turnos registrados.' });
        }

        const base = userSelection.temporarySelections.length > 0
            ? userSelection.temporarySelections
            : userSelection.originalSelections;

        const nuevosTemporales = base.filter(
            t => !(t.day === day && t.hour === hour)
        );

        userSelection.temporarySelections = nuevosTemporales.length > 0
            ? nuevosTemporales
            : [{ day: '__placeholder__', hour: '__none__' }];
        userSelection.lastChange = new Date();
        userSelection.changesThisMonth = userSelection.changesThisMonth || 0;

        await userSelection.save();
        return res.json({ message: `El turno de ${day} ${hour} fue cancelado para esta semana.` });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Error al cancelar el turno.' });
    }
};

// Volver a los turnos originales
const resetUserSelections = async (req, res) => {
    try {
        const userId = req.user.id;

        const userSelection = await UserSelection.findOne({ user: userId });

        if (!userSelection) {
            return res.status(400).json({ message: 'No hay turnos registrados.' });
        }

        userSelection.temporarySelections = [];
        userSelection.lastChange = null;

        await userSelection.save();

        return res.json({ message: 'Volviste a tus turnos originales.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'No se pudo volver a los turnos originales.' });
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

// Admin: Mover un usuario a un nuevo turno original
const adminMoverUsuario = async (req, res) => {
    try {
        const { userFullName, current, newTurn, type } = req.body;

        if (type !== 'original') {
            return res.status(400).json({ message: 'Solo se pueden cambiar turnos permanentes (originales).' });
        }

        if (!userFullName || !current || !newTurn) {
            return res.status(400).json({ message: 'Faltan datos requeridos.' });
        }

        // Limpiamos nombre completo y separamos nombre y apellido
        const partes = userFullName.trim().split(' ').filter(Boolean);
        const apellido = partes.pop().trim();
        const nombre = partes.join(' ').trim();

        // Buscamos todos los usuarios y comparamos con trim + lowercase para mayor tolerancia
        const todos = await User.find({});
        const user = todos.find(u =>
            u.nombre.trim().toLowerCase() === nombre.toLowerCase() &&
            u.apellido.trim().toLowerCase() === apellido.toLowerCase()
        );

        if (!user) return res.status(404).json({ message: 'Usuario no encontrado.' });

        const userSelection = await UserSelection.findOne({ user: user._id });
        if (!userSelection) return res.status(404).json({ message: 'El usuario no tiene turnos asignados.' });

        if (!userSelection.originalSelections) userSelection.originalSelections = [];

        // 1. Eliminar el turno actual de originalSelections
        userSelection.originalSelections = userSelection.originalSelections.filter(
            t => !(t.day === current.day && t.hour === current.hour)
        );

        // 2. Agregar nuevo turno si no está repetido
        const yaExiste = userSelection.originalSelections.some(
            t => t.day === newTurn.day && t.hour === newTurn.hour
        );
        if (!yaExiste) {
            userSelection.originalSelections.push({ day: newTurn.day, hour: newTurn.hour });
        }

        await userSelection.save();
        return res.json({ message: 'Cambio realizado correctamente.' });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Error al mover el usuario.' });
    }
};

// Admin: Restaurar turnos originales y devolver cambio mensual
const adminResetToOriginals = async (req, res) => {
    try {
        const { userFullName } = req.body;
        if (!userFullName) return res.status(400).json({ message: 'Falta el nombre del usuario.' });

        const partes = userFullName.trim().split(' ').filter(Boolean);
        const apellido = partes.pop();
        const nombre = partes.join(' ');

        const todos = await User.find({});
        const user = todos.find(u =>
            u.nombre.trim().toLowerCase() === nombre.toLowerCase() &&
            u.apellido.trim().toLowerCase() === apellido.toLowerCase()
        );

        if (!user) return res.status(404).json({ message: 'Usuario no encontrado.' });

        const userSelection = await UserSelection.findOne({ user: user._id });
        if (!userSelection) return res.status(400).json({ message: 'No hay selección de turnos registrada.' });

        if (userSelection.temporarySelections.length === 0) {
            return res.status(400).json({ message: 'El usuario ya está usando sus turnos originales.' });
        }

        userSelection.temporarySelections = [];
        userSelection.lastChange = null;

        // Restar un cambio mensual si tiene al menos uno registrado
        if (userSelection.changesThisMonth && userSelection.changesThisMonth > 0) {
            userSelection.changesThisMonth -= 1;
        }

        await userSelection.save();

        return res.json({ message: 'Turnos temporales eliminados. Se restauraron los originales y se devolvió el cambio mensual.' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Error al restaurar los turnos del usuario.' });
    }
};

// Admin: Cancelar un turno temporalmente
const adminCancelarTurnoTemporalmente = async (req, res) => {
    try {
        const { userFullName, day, hour } = req.body;

        if (!userFullName || !day || !hour) {
            return res.status(400).json({ message: 'Faltan datos requeridos.' });
        }

        // Limpiar y separar nombre/apellido
        const partes = userFullName.trim().split(' ').filter(Boolean);
        const apellido = partes.pop().trim();
        const nombre = partes.join(' ').trim();

        const todos = await User.find({});
        const user = todos.find(u =>
            u.nombre.trim().toLowerCase() === nombre.toLowerCase() &&
            u.apellido.trim().toLowerCase() === apellido.toLowerCase()
        );

        if (!user) return res.status(404).json({ message: 'Usuario no encontrado.' });

        const userSelection = await UserSelection.findOne({ user: user._id });
        if (!userSelection) return res.status(400).json({ message: 'No hay turnos registrados.' });

        const base = userSelection.temporarySelections.length > 0
            ? userSelection.temporarySelections
            : userSelection.originalSelections;

        const nuevosTemporales = base.filter(
            t => !(t.day === day && t.hour === hour)
        );

        // Si se eliminan todos, dejamos un placeholder
        userSelection.temporarySelections = nuevosTemporales.length > 0
            ? nuevosTemporales
            : [{ day: '__placeholder__', hour: '__none__' }];

        userSelection.lastChange = new Date();
        userSelection.changesThisMonth = userSelection.changesThisMonth || 0;

        await userSelection.save();
        return res.json({ message: `Turno de ${day} ${hour} cancelado para esta semana.` });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Error al cancelar el turno del usuario.' });
    }
};


//FERIADOS
// Marcar un feriado
const marcarFeriado = async (req, res) => {
    const { date } = req.body;
    if (!date) return res.status(400).json({ message: 'Falta la fecha del feriado.'});

    try {
        await Holiday.findOneAndUpdate(
            {date},
            {date},
            { upsert: true, new: true }
        );
        res.json({ message: 'Feriado marcado correctamente.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al guardar el feriado.' });
    }

}

// Obtener todos los feriados
const getFeriados = async (req, res) => {
    try {
        const feriados = await Holiday.find();
        res.json(feriados);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener los feriados.' });
    }
};

// Eliminar un feriado
const quitarFeriado = async (req, res) => {
    const { date } = req.body;
    if (!date) return res.status(400).json({ message: 'Falta la fecha.' });

    try {
        await Holiday.deleteOne({ date });
        res.json({ message: 'Feriado eliminado correctamente.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al eliminar el feriado.' });
    }
};

// Guardar un turno para recuperar
const guardarTurnoParaRecuperar = async (req, res) => {
    try {
        const userId = req.user.id;
        const { day, hour } = req.body;
        if (!day || !hour) {
            return res.status(400).json({ message: 'Faltan datos.' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }

        // Validar bloqueo por falta de pago
        const hoy = new Date();
        if (!user.pago && hoy.getDate() > 10) {
            return res.status(403).json({ message: 'Debés realizar tu pago correspondiente para cambiar o recuperar turnos.' });
        }

        const userSelection = await UserSelection.findOne({ user: userId });
        if (!userSelection) {
            return res.status(404).json({ message: 'No hay selección registrada.' });
        }

        // Lógica de conteo mensual
        const sameMonth = userSelection.lastChange &&
        userSelection.lastChange.getMonth() === hoy.getMonth() &&
        userSelection.lastChange.getFullYear() === hoy.getFullYear();

        if (sameMonth) {
                if (userSelection.changesThisMonth >= 2) {
                    return res.status(403).json({ message: 'Ya alcanzaste el límite de 2 cambios este mes.' });
                } else {
                    userSelection.changesThisMonth += 1;
                }
            } else {
                userSelection.changesThisMonth = 1;
            }

            userSelection.lastChange = hoy;

            const mondayOfWeek = new Date();
            mondayOfWeek.setDate(mondayOfWeek.getDate() - ((mondayOfWeek.getDay() + 6) % 7));

            const nuevo = new RecoverableTurn({
                user: userId,
                originalDay: day,
                originalHour: hour,
                cancelledWeek: mondayOfWeek
            });

            await userSelection.save();
            await nuevo.save();

            return res.json({ message: 'Turno guardado para recuperar.' });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Error al guardar el turno recuperable.' });
    }
};

// Listar turnos recuperables
const listarTurnosRecuperables = async (req, res) => {
    try {
        const userId = req.user.id;

        const turnos = await RecoverableTurn.find({ user: userId, recovered: false });

        // Devolver también la fecha formateada
        const turnosFormateados = turnos.map(t => ({
            _id: t._id,
            originalDay: t.originalDay,
            originalHour: t.originalHour,
            cancelDate: t.cancelledWeek, // puede formatearse en el frontend
        }));

        res.json(turnosFormateados);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error al listar los turnos recuperables.' });
    }
};

// Usar turno recuperado
const capitalize = s => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();

const usarTurnoRecuperado = async (req, res) => {
    try {
        const userId = req.user.id;
        const { turnId, day, hour } = req.body;

        if (!turnId || !day || !hour) {
            return res.status(400).json({ message: 'Faltan datos.' });
        }

        const turno = await RecoverableTurn.findOne({ _id: turnId, user: userId, recovered: false });
        if (!turno) {
            return res.status(404).json({ message: 'Turno no encontrado o ya utilizado.' });
        }

        const diaCapitalizado = capitalize(day);

        // Calcular fecha exacta del día elegido, basándonos en si hoy es sábado o domingo
        const today = new Date();
        const dayOfWeek = today.getDay(); // 0 = domingo, 6 = sábado
        const dayIndex = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'].indexOf(diaCapitalizado);

        const monday = new Date(today);

        if (dayOfWeek === 6) {
            // sábado → saltamos al lunes siguiente
            monday.setDate(today.getDate() + 2);
        } else if (dayOfWeek === 0) {
            // domingo → saltamos al lunes siguiente
            monday.setDate(today.getDate() + 1);
        } else {
            // lunes a viernes → vamos al lunes actual
            monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7));
        }

        const recoveryDate = new Date(monday);
        recoveryDate.setDate(monday.getDate() + dayIndex);

        // Actualizar solo el modelo RecoverableTurn
        turno.recovered = true;
        turno.recoveryDate = recoveryDate;
        turno.assignedDay = diaCapitalizado;
        turno.assignedHour = hour;

        await turno.save();

        res.json({ message: 'Turno recuperado exitosamente.' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error al recuperar el turno.' });
    }
};


const listarTurnosRecuperadosUsados = async (req, res) => {
    try {
        const userId = req.user.id;
        const { startDate, endDate } = req.query;

        if (!startDate || !endDate) {
            return res.status(400).json({ message: 'Faltan fechas de inicio o fin.' });
        }

        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999); // incluir todo el último día

        const turnos = await RecoverableTurn.find({
            user: userId,
            recovered: true,
            recoveryDate: { $gte: start, $lte: end }
        });

        const resultados = turnos.map(t => ({
            _id: t._id,
            day: t.assignedDay,
            hour: t.assignedHour,
            nombre: `${req.user.nombre} ${req.user.apellido}`,
            tipo: 'recuperado'
        }));

        res.json(resultados);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al listar turnos recuperados usados.' });
    }
};

const listarTodosLosTurnosRecuperadosUsados = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        if (!startDate || !endDate) {
            return res.status(400).json({ message: 'Faltan fechas de inicio o fin.' });
        }

        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        const turnos = await RecoverableTurn.find({
            recovered: true,
            recoveryDate: { $gte: start, $lte: end }
        }).populate('user', 'nombre apellido');

        const resultados = turnos
            .filter(t => t.user) // Evita error si el usuario fue eliminado
            .map(t => ({
                day: t.assignedDay,
                hour: t.assignedHour,
                nombre: `${t.user.nombre} ${t.user.apellido}`,
                tipo: 'recuperado'
            }));

        res.json(resultados);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error al listar todos los turnos recuperados.' });
    }
};


const limpiarTurnosRecuperadosViejos = async (req, res) => {
    try {
        const hoy = new Date();
        const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1); // ej: 2025-06-01

        const resultado = await RecoverableTurn.deleteMany({
            recovered: true,
            recoveryDate: { $lt: primerDiaMes }
        });

        res.json({
            message: `Se eliminaron ${resultado.deletedCount} turnos recuperados anteriores a ${primerDiaMes.toISOString().slice(0, 10)}.`
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al limpiar turnos viejos.' });
    }
};

//ADMIN: Eliminar un turno recuperado y devolverlo al usuario
const adminEliminarTurnoRecuperado = async (req, res) => {
    try {
        const { userFullName, day, hour } = req.body;

        if (!userFullName || !day || !hour) {
            return res.status(400).json({ message: 'Faltan datos requeridos.' });
        };

        // Separar nombre y apellido
        const partes = userFullName.trim().split(' ').filter(Boolean);
        const apellido = partes.pop().trim();
        const nombre = partes.join(' ').trim();

        const todos = await User.find({});
        const user = todos.find(u =>
            u.nombre.trim().toLowerCase() === nombre.toLowerCase() &&
            u.apellido.trim().toLowerCase() === apellido.toLowerCase()
        );

        if (!user) return res.status(404).json({ message: 'Usuario no encontrado.' });

        // Buscar el turno recuperado que coincida
        const turno = await RecoverableTurn.findOne({
            user: user._id,
            assignedDay: day,
            assignedHour: hour,
            recovered: true
        });

        if (!turno) {
            return res.status(404).json({ message: 'Turno recuperado no encontrado.' });
        }

        // Revertimos el turno disponible
        turno.recovered = false;
        turno.recoveryDate = null;
        turno.assignedDay = null;
        turno.assignedHour = null;

        await turno.save();

        return res.json({
            message: `El turno recuperado de ${turno.user.nombre} ${turno.user.apellido} fue eliminado. Ahora puede volver a usarlo.`
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Error al eliminar el turno recuperado.' });
    }
};

// Usuario: eliminar su propio turno recuperado
const usuarioEliminarTurnoRecuperado = async (req, res) => {
    try {
        const userId = req.user.id;
        const { day, hour } = req.body;

        if (!day || !hour) {
            return res.status(400).json({ message: 'Faltan datos.' });
        }

        const turno = await RecoverableTurn.findOne({
            user: userId,
            assignedDay: day,
            assignedHour: hour,
            recovered: true
        });

        if (!turno) {
            return res.status(404).json({ message: 'Turno recuperado no encontrado.' });
        }

        turno.recovered = false;
        turno.recoveryDate = null;
        turno.assignedDay = null;
        turno.assignedHour = null;
        await turno.save();

        return res.json({ message: 'Turno recuperado eliminado. Ahora podrás volver a usarlo.' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Error al eliminar el turno recuperado.' });
    }
};

module.exports = {
    getUserSelections,
    setUserSelections,
    getAllTurnosPorHorario,
    adminMoverUsuario,
    marcarFeriado,
    getFeriados,
    resetUserSelections,
    eliminarTurnoPorEstaSemana,
    quitarFeriado,
    guardarTurnoParaRecuperar,
    listarTurnosRecuperables,
    usarTurnoRecuperado,
    adminCancelarTurnoTemporalmente,
    listarTurnosRecuperadosUsados,
    limpiarTurnosRecuperadosViejos,
    setOriginalSelections,
    listarTodosLosTurnosRecuperadosUsados,
    adminResetToOriginals,
    adminEliminarTurnoRecuperado,
    usuarioEliminarTurnoRecuperado
};
