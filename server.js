const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const calendarRoutes = require('./routes/calendarRoutes');
const usuariosRoutes = require('./routes/usuariosRoutes');
const authMiddleware = require('./middleware/authMiddleware');
const adminMiddleware = require('./middleware/adminMiddleware');
const { resetCambioMensual, resetCambiosSemanales } = require('./cronJobs/resetCambioMensual');
const recordatorioPago = require('./utils/recordatorioPago');

dotenv.config();

const app = express();
app.use(cors({
    origin: `${process.env.FRONTEND_URL}`,
    credentials: true
}));
app.use(express.json());

connectDB(); // Conecta a MongoDB

recordatorioPago(); // Inicia el cron job para enviar recordatorios de pago
resetCambioMensual(); // Inicia el cron job para reiniciar cambios mensuales
resetCambiosSemanales(); // Inicia el cron job para reiniciar cambios semanales

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/usuarios', usuariosRoutes);

app.get('/', (req, res) => {
    res.send('Servidor funcionando correctamente.')
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});
