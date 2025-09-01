const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

let isConnected = false; // bandera para saber si ya nos conectamos

const connectDB = async () => {
    if (isConnected) {
        console.log("📌 Usando conexión existente a MongoDB");
        return;
    }

    try {
        const conn = await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            maxPoolSize: 10, // 🔑 límite de conexiones simultáneas
        });

        isConnected = conn.connections[0].readyState; // 1 = conectado
        console.log("🟢 Conectado a MongoDB");
    } catch (error) {
        console.error("❌ Error al conectar a MongoDB:", error);
        process.exit(1);
    }
};

module.exports = connectDB;


/*const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('🟢 Conectado a MongoDB');
    } catch (error) {
        console.error('❌ Error al conectar a MongoDB:', error);
        process.exit(1);
    }
};

module.exports = connectDB;*/
