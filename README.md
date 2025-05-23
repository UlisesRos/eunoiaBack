# 🧘‍♀️ App de Gestión de Horarios de Pilates

Esta es una aplicación web diseñada para que los usuarios puedan **registrarse, iniciar sesión y seleccionar sus días y horarios de entrenamiento** de manera organizada y limitada.

---

## 🚀 Funcionalidades principales

- ✅ **Registro e inicio de sesión** con autenticación segura (JWT).
- ✅ Cada usuario tiene una cantidad de días semanales asignados (`diasSemanales`).
- ✅ Visualización del **calendario semanal** con días de lunes a viernes y horarios por turno.
- ✅ Modal para seleccionar horarios con:
  - Cupo limitado por turno (7 personas máximo).
  - Restricción: **solo un horario por día**.
  - Límite de **2 cambios por mes** para modificar los horarios.
- ✅ Panel responsive optimizado para **móvil y escritorio**.
- ✅ Reinicio automático del calendario cada sábado (back configurado).
- ✅ Vista clara de turnos ocupados y seleccionados.
- ✅ Estilos personalizados con Chakra UI.

---

## 📦 Tecnologías utilizadas

- **Frontend**: React + Chakra UI
- **Backend**: Node.js + Express
- **Base de datos**: MongoDB (Mongoose)
- **Autenticación**: JSON Web Tokens (JWT)

---

## 🔐 Estructura general

- `LoginPage`: permite a los usuarios autenticarse.
- `RegisterPage`: formulario de registro.
- `CalendarioPage`: panel principal del usuario con el calendario.
- `SelectDaysModal`: modal donde el usuario elige y modifica sus horarios disponibles.
- `CalendarGrid`, `DayColumn`, `TimeSlot`: estructura modular del calendario.
- `calendarController.js`: lógica del backend para asignar turnos con validaciones.
- `UserSelection`: modelo que guarda las selecciones de cada usuario.

---

## 📱 Responsive

La app está completamente adaptada a dispositivos móviles:
- Los horarios se muestran en vertical en pantallas pequeñas.
- Todo el contenido se ajusta al ancho sin scroll lateral.

---

## 🧠 Reglas de negocio importantes

- Cada usuario puede elegir hasta su `diasSemanales`.
- No se puede seleccionar más de un horario en el mismo día.
- Máximo 2 cambios por mes, controlados automáticamente.
- Cada horario permite hasta 7 personas.
"""