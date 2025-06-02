const mongoose = require('mongoose');
const UserSelection = require('../models/UserSelection'); // Ajustá si el path es distinto

const MONGODB_URI = 'mongodb+srv://ornellamongodb:Ulises123@eunoia.fjyogll.mongodb.net/eunoia?retryWrites=true&w=majority&appName=Eunoia';

async function migrarUserSelections() {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    const usuarios = await UserSelection.find({ selections: { $exists: true } });

    for (const usuario of usuarios) {
      console.log(`⏳ Actualizando usuario: ${usuario.user}`);

      usuario.originalSelections = usuario.selections || [];

      // ✅ Forzamos que se guarde aunque esté vacío
      usuario.temporarySelections = [];

      if (usuario.changesThisMonth === undefined) {
        usuario.changesThisMonth = -1;
      }

      if (usuario.lastChange === undefined) {
        usuario.lastChange = null;
      }

      // ✅ Eliminamos el campo viejo correctamente
      delete usuario._doc.selections;
      usuario.markModified('selections');

      await usuario.save();
      console.log(`✅ Usuario ${usuario.user} actualizado.`);
    }

    console.log('\n✅ Migración completada con éxito');
    mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    mongoose.disconnect();
  }
}

migrarUserSelections();
