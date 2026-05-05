const User = require('../models/User');
const UserSelection = require('../models/UserSelection');

const deleteUser = async (req, res) => {
    try {
        const userDeleted = await User.findByIdAndDelete(req.params.id);

        if (!userDeleted) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        // Eliminar también su selección si existe
        await UserSelection.findOneAndDelete({ user: userDeleted._id });

        res.status(200).json({ message: 'Usuario y selección eliminados correctamente' });
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar el usuario', error });
    }
};

const editUser = async (req, res) => {
    try {
        // Primero obtenemos el usuario actual para comparar
        const userActual = await User.findById(req.params.id);
        
        if (!userActual) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        const { nombre, apellido, celular, email, diasSemanales } = req.body;
        const camposPermitidos = {};
        if (nombre !== undefined) camposPermitidos.nombre = nombre;
        if (apellido !== undefined) camposPermitidos.apellido = apellido;
        if (celular !== undefined) camposPermitidos.celular = celular;
        if (email !== undefined) camposPermitidos.email = email;
        if (diasSemanales !== undefined) camposPermitidos.diasSemanales = diasSemanales;

        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            camposPermitidos,
            { new: true }
        );

        // Si cambiaron los diasSemanales, limpiamos los turnos originales
        if (req.body.diasSemanales && req.body.diasSemanales !== userActual.diasSemanales) {
            const userSelection = await UserSelection.findOne({ user: req.params.id });
            
            if (userSelection) {
                // Limpiamos originalSelections para forzar al usuario a elegir nuevos turnos
                userSelection.originalSelections = [];
                // También limpiamos temporales por si acaso
                userSelection.temporarySelections = [];
                // Reseteamos el contador de cambios
                userSelection.changesThisMonth = 0;
                userSelection.lastChange = null;
                
                await userSelection.save();
                
                console.log(`✅ Se limpiaron los turnos del usuario ${updatedUser.nombre} ${updatedUser.apellido} debido al cambio de diasSemanales de ${userActual.diasSemanales} a ${req.body.diasSemanales}`);
            }
        }

        res.status(200).json(updatedUser);
    } catch (error) {
        console.error('Error al actualizar el usuario:', error);
        res.status(500).json({ message: 'Error al actualizar el usuario', error });
    } 
};

const updatePago = async (req, res) => {
    try {
        const { pago } = req.body;

        const userUpdated = await User.findByIdAndUpdate(
            req.params.id,
            {
                pago,
                fechaPago: pago ? new Date() : null,
            },
            { new: true }
        );  

        if (!userUpdated) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        res.status(200).json(userUpdated);
    } catch (error) {
        console.error('Error al actualizar el pago:', error);
        res.status(500).json({ message: 'Error al actualizar el pago', error });
    }
};


module.exports = {
    deleteUser,
    editUser,
    updatePago
};