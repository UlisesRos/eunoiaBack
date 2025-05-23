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
        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            req.body, 
            { new: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        res.status(200).json(updatedUser);
    } catch (error) {
        res.status(500).json({ message: 'Error al actualizar el usuario', error });
    } 
};

const updatePago = async (req, res) => {
    try {
        const { pago } = req.body;

        const userUpdated = await User.findByIdAndUpdate(
        req.params.id,
        { pago },
        { new: true }
        );

        if (!userUpdated) {
        return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        res.status(200).json(userUpdated);
    } catch (error) {
        res.status(500).json({ message: 'Error al actualizar el pago', error });
    }
};

module.exports = {
    deleteUser,
    editUser,
    updatePago
};