const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database/db');

// POST /api/auth/login
router.post('/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email y contraseña son requeridos' });
    }

    const usuario = db.prepare('SELECT * FROM usuarios WHERE email = ?').get(email);

    if (!usuario) {
        return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    if (!usuario.activo) {
        return res.status(401).json({ error: 'Usuario inactivo, contacte al administrador' });
    }

    const passwordValida = bcrypt.compareSync(password, usuario.password);
    if (!passwordValida) {
        return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    const token = jwt.sign(
        { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol },
        process.env.JWT_SECRET,
        { expiresIn: '8h' }
    );

    res.json({
        token,
        usuario: {
            id: usuario.id,
            nombre: usuario.nombre,
            email: usuario.email,
            rol: usuario.rol
        }
    });
});

// POST /api/auth/recuperar
router.post('/recuperar', (req, res) => {
    const { email } = req.body;
    const usuario = db.prepare('SELECT id, email FROM usuarios WHERE email = ?').get(email);

    // por seguridad siempre respondemos lo mismo
    if (usuario) {
        // en produccion aqui se enviaria un correo
        console.log(`Solicitud de recuperacion para: ${email}`);
    }

    res.json({ mensaje: 'Si el correo existe, recibirás las instrucciones pronto' });
});

module.exports = router;
