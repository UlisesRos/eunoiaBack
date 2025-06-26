const ModalInfo = require('../models/ModalInfo');

const getLatestInfoModal = async (req, res) => {
    try {
        const modal = await ModalInfo.findOne().sort({ createdAt: -1 });
        if (!modal) return res.json({});
        res.json(modal);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener la novedad' });
    }
};

const createInfoModal = async (req, res) => {
    const { title, description, link } = req.body;

    if (!title || !description) {
        return res.status(400).json({ message: 'Título y descripción son requeridos.' });
    }

    try {
        const newModal = new ModalInfo({ title, description, link });
        await newModal.save();
        res.status(201).json({ message: 'Novedad guardada correctamente.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al guardar la novedad' });
    }
};

const clearAllInfoModals = async (req, res) => {
    try {
        await ModalInfo.deleteMany({});
        res.json({ message: 'Todas las novedades fueron eliminadas.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al eliminar las novedades.' });
    }
};

module.exports = {
    getLatestInfoModal,
    createInfoModal,
    clearAllInfoModals
};