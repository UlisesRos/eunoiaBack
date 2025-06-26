const express = require('express');
const router = express.Router();
const { getLatestInfoModal, createInfoModal, clearAllInfoModals } = require('../controllers/infoControllers');

// GET para usuarios
router.get('/info-modal', getLatestInfoModal);

// POST para admin (restringilo con middleware si tenés autenticación)
router.post('/info-modal', createInfoModal);

// DELETE para admin
router.post('/info-modal/clear', clearAllInfoModals);

module.exports = router;
