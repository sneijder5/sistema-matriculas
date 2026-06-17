const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { verificarToken, soloProfesor } = require('../middleware/auth');

// GET /api/notas/mis-materias — materias asignadas al profesor
router.get('/mis-materias', verificarToken, soloProfesor, (req, res) => {
    const materias = db.prepare(`
        SELECT m.id, m.nombre, c.nombre as curso
        FROM materias m
        JOIN cursos c ON m.curso_id = c.id
        WHERE m.profesor_id = ?
    `).all(req.usuario.id);
    res.json(materias);
});

// GET /api/notas/materia/:id — estudiantes y notas de una materia
router.get('/materia/:id', verificarToken, soloProfesor, (req, res) => {
    const estudiantes = db.prepare(`
        SELECT u.id, u.nombre, u.email,
               n.id as nota_id, n.nota
        FROM matriculas mt
        JOIN usuarios u ON mt.estudiante_id = u.id
        JOIN materias m ON mt.curso_id = m.curso_id
        LEFT JOIN notas n ON n.estudiante_id = u.id AND n.materia_id = m.id
        WHERE m.id = ? AND mt.estado = 'activa'
    `).all(req.params.id);
    res.json(estudiantes);
});

// POST /api/notas — ingresar nota
router.post('/', verificarToken, soloProfesor, (req, res) => {
    const { estudiante_id, materia_id, nota } = req.body;

    if (nota < 0 || nota > 5) {
        return res.status(400).json({ error: 'La nota debe estar entre 0 y 5' });
    }

    const existe = db.prepare('SELECT id FROM notas WHERE estudiante_id = ? AND materia_id = ?').get(estudiante_id, materia_id);

    if (existe) {
        db.prepare('UPDATE notas SET nota = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(nota, existe.id);
        return res.json({ mensaje: 'Nota actualizada' });
    }

    db.prepare('INSERT INTO notas (estudiante_id, materia_id, nota) VALUES (?, ?, ?)').run(estudiante_id, materia_id, nota);
    res.status(201).json({ mensaje: 'Nota registrada' });
});

// DELETE /api/notas/:id — eliminar nota
router.delete('/:id', verificarToken, soloProfesor, (req, res) => {
    db.prepare('DELETE FROM notas WHERE id = ?').run(req.params.id);
    res.json({ mensaje: 'Nota eliminada' });
});

// GET /api/notas/mis-notas — notas del estudiante autenticado
router.get('/mis-notas', verificarToken, (req, res) => {
    const notas = db.prepare(`
        SELECT m.nombre as materia, c.nombre as curso, n.nota, n.updated_at
        FROM notas n
        JOIN materias m ON n.materia_id = m.id
        JOIN cursos c ON m.curso_id = c.id
        WHERE n.estudiante_id = ?
        ORDER BY c.nombre, m.nombre
    `).all(req.usuario.id);
    res.json(notas);
});

module.exports = router;
