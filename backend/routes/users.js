const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../database/db');
const { verificarToken, soloAdmin } = require('../middleware/auth');

// GET /api/usuarios — listar todos
router.get('/', verificarToken, soloAdmin, (req, res) => {
    const usuarios = db.prepare(`
        SELECT id, nombre, email, rol, activo, created_at FROM usuarios ORDER BY created_at DESC
    `).all();
    res.json(usuarios);
});

// POST /api/usuarios — crear usuario
router.post('/', verificarToken, soloAdmin, (req, res) => {
    const { nombre, email, password, rol } = req.body;

    if (!nombre || !email || !password || !rol) {
        return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }

    const rolesValidos = ['administrador', 'profesor', 'estudiante', 'soporte'];
    if (!rolesValidos.includes(rol)) {
        return res.status(400).json({ error: 'Rol no valido' });
    }

    const existe = db.prepare('SELECT id FROM usuarios WHERE email = ?').get(email);
    if (existe) {
        return res.status(400).json({ error: 'El email ya esta registrado' });
    }

    const hash = bcrypt.hashSync(password, 10);
    const result = db.prepare(`
        INSERT INTO usuarios (nombre, email, password, rol) VALUES (?, ?, ?, ?)
    `).run(nombre, email, hash, rol);

    res.status(201).json({ id: result.lastInsertRowid, mensaje: 'Usuario creado exitosamente' });
});

// PUT /api/usuarios/:id — editar usuario
router.put('/:id', verificarToken, soloAdmin, (req, res) => {
    const { nombre, email, rol } = req.body;
    const { id } = req.params;

    const usuario = db.prepare('SELECT id FROM usuarios WHERE id = ?').get(id);
    if (!usuario) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    db.prepare(`
        UPDATE usuarios SET nombre = ?, email = ?, rol = ? WHERE id = ?
    `).run(nombre, email, rol, id);

    res.json({ mensaje: 'Usuario actualizado' });
});

// PATCH /api/usuarios/:id/estado — activar o inactivar
router.patch('/:id/estado', verificarToken, soloAdmin, (req, res) => {
    const { activo } = req.body;
    const { id } = req.params;

    db.prepare('UPDATE usuarios SET activo = ? WHERE id = ?').run(activo ? 1 : 0, id);
    res.json({ mensaje: `Usuario ${activo ? 'activado' : 'inactivado'} correctamente` });
});

// DELETE /api/usuarios/:id — eliminar usuario
router.delete('/:id', verificarToken, soloAdmin, (req, res) => {
    const { id } = req.params;

    if (parseInt(id) === req.usuario.id) {
        return res.status(400).json({ error: 'No puedes eliminarte a ti mismo' });
    }

    db.prepare('DELETE FROM usuarios WHERE id = ?').run(id);
    res.json({ mensaje: 'Usuario eliminado' });
});

module.exports = router;
