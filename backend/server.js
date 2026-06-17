const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { initDB } = require('./database/db');

const app = express();

app.use(cors());
app.use(express.json());

// servir archivos del frontend
app.use(express.static(path.join(__dirname, '../frontend')));

async function startServer() {
    await initDB();

    // rutas de la API
    app.use('/api/auth', require('./routes/auth'));
    app.use('/api/usuarios', require('./routes/users'));
    app.use('/api/cursos', require('./routes/courses'));
    app.use('/api/notas', require('./routes/grades'));
    app.use('/api/matriculas', require('./routes/enrollments'));
    app.use('/api/reportes', require('./routes/reports'));

    // cualquier otra ruta manda al index
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '../frontend/index.html'));
    });

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Servidor corriendo en http://localhost:${PORT}`);
    });
}

startServer().catch(err => {
    console.error('Error al iniciar el servidor:', err);
    process.exit(1);
});
