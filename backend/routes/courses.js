const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { verificarToken, soloAdmin } = require('../middleware/auth');

// GET /api/cursos
router.get('/', verificarToken, (req, res) => {
    const cursos = db.prepare('SELECT * FROM cursos ORDER BY nombre').all();
    res.json(cursos);
});

// POST /api/cursos
router.post('/', verificarToken, soloAdmin, (req, res) => {
    const { nombre, descripcion } = req.body;
    if (!nombre) return res.status(400).json({ error: 'El nombre es requerido' });

    const result = db.prepare('INSERT INTO cursos (nombre, descripcion) VALUES (?, ?)').run(nombre, descripcion || '');
    res.status(201).json({ id: result.lastInsertRowid, mensaje: 'Curso creado' });
});

// PUT /api/cursos/:id
router.put('/:id', verificarToken, soloAdmin, (req, res) => {
    const { nombre, descripcion } = req.body;
    db.prepare('UPDATE cursos SET nombre = ?, descripcion = ? WHERE id = ?').run(nombre, descripcion, req.params.id);
    res.json({ mensaje: 'Curso actualizado' });
});

// DELETE /api/cursos/:id
router.delete('/:id', verificarToken, soloAdmin, (req, res) => {
    db.prepare('DELETE FROM cursos WHERE id = ?').run(req.params.id);
    res.json({ mensaje: 'Curso eliminado' });
});

// GET /api/cursos/:id/materias
router.get('/:id/materias', verificarToken, (req, res) => {
    const materias = db.prepare(`
        SELECT m.*, u.nombre as profesor_nombre
        FROM materias m
        LEFT JOIN usuarios u ON m.profesor_id = u.id
        WHERE m.curso_id = ?
    `).all(req.params.id);
    res.json(materias);
});

// POST /api/cursos/:id/materias
router.post('/:id/materias', verificarToken, soloAdmin, (req, res) => {
    const { nombre, profesor_id } = req.body;
    if (!nombre) return res.status(400).json({ error: 'Nombre requerido' });

    const result = db.prepare(`
        INSERT INTO materias (nombre, curso_id, profesor_id) VALUES (?, ?, ?)
    `).run(nombre, req.params.id, profesor_id || null);

    res.status(201).json({ id: result.lastInsertRowid, mensaje: 'Materia creada' });
});

// PUT /api/cursos/materias/:id — actualizar materia
router.put('/materias/:id', verificarToken, soloAdmin, (req, res) => {
    const { nombre, profesor_id } = req.body;
    db.prepare('UPDATE materias SET nombre = ?, profesor_id = ? WHERE id = ?').run(nombre, profesor_id || null, req.params.id);
    res.json({ mensaje: 'Materia actualizada' });
});

// DELETE /api/cursos/materias/:id
router.delete('/materias/:id', verificarToken, soloAdmin, (req, res) => {
    db.prepare('DELETE FROM materias WHERE id = ?').run(req.params.id);
    res.json({ mensaje: 'Materia eliminada' });
});

// GET /api/cursos/profesores — listar solo profesores (para asignar)
router.get('/profesores/lista', verificarToken, soloAdmin, (req, res) => {
    const profesores = db.prepare("SELECT id, nombre, email FROM usuarios WHERE rol = 'profesor' AND activo = 1").all();
    res.json(profesores);
});

module.exports = router;
