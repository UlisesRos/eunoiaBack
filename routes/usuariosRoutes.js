const express = require('express');
const router = express.Router();
const { deleteUser, editUser, updatePago } = require('../controllers/usuarioscontrollers');

// Ruta para eliminar un usuario
router.delete('/delete/:id', deleteUser);

// Ruta para editar un usuario
router.put('/edit/:id', editUser);

// Ruta para actualizar el estado de pago de un usuario
router.patch('/updatePago/:id', updatePago);

module.exports = router;