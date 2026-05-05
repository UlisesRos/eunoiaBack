const express = require('express');
const router = express.Router();
const { deleteUser, editUser, updatePago } = require('../controllers/usuarioscontrollers');
const auth = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

router.delete('/delete/:id', auth, adminMiddleware, deleteUser);
router.put('/edit/:id', auth, adminMiddleware, editUser);
router.patch('/updatePago/:id', auth, adminMiddleware, updatePago);

module.exports = router;