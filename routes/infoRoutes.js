const express = require('express');
const router = express.Router();
const { getLatestInfoModal, createInfoModal, clearAllInfoModals } = require('../controllers/infoControllers');
const auth = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

router.get('/info-modal', getLatestInfoModal);
router.post('/info-modal', auth, adminMiddleware, createInfoModal);
router.post('/info-modal/clear', auth, adminMiddleware, clearAllInfoModals);

module.exports = router;
