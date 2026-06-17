const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { verificarToken, soloAdmin } = require('../middleware/auth');

// GET /api/matriculas — todas las matriculas (admin)
router.get('/', verificarToken, soloAdmin, (req, res) => {
    const matriculas = db.prepare(`
        SELECT mt.id, mt.estado, mt.fecha_inicio,
               u.nombre as estudiante, u.email,
               c.nombre as curso
        FROM matriculas mt
        JOIN usuarios u ON mt.estudiante_id = u.id
        JOIN cursos c ON mt.curso_id = c.id
        ORDER BY mt.fecha_inicio DESC
    `).all();
    res.json(matriculas);
});

// GET /api/matriculas/mi-matricula — matricula del estudiante
router.get('/mi-matricula', verificarToken, (req, res) => {
    const matricula = db.prepare(`
        SELECT mt.id, mt.estado, mt.fecha_inicio, c.nombre as curso, c.id as curso_id
        FROM matriculas mt
        JOIN cursos c ON mt.curso_id = c.id
        WHERE mt.estudiante_id = ?
        ORDER BY mt.fecha_inicio DESC
        LIMIT 1
    `).get(req.usuario.id);

    if (!matricula) {
        return res.json({ matricula: null, mensaje: 'No tienes matricula activa' });
    }

    res.json(matricula);
});

// POST /api/matriculas — crear matricula (admin)
router.post('/', verificarToken, soloAdmin, (req, res) => {
    const { estudiante_id, curso_id } = req.body;

    const yaMatriculado = db.prepare(`
        SELECT id FROM matriculas WHERE estudiante_id = ? AND curso_id = ? AND estado = 'activa'
    `).get(estudiante_id, curso_id);

    if (yaMatriculado) {
        return res.status(400).json({ error: 'El estudiante ya esta matriculado en este curso' });
    }

    const result = db.prepare(`
        INSERT INTO matriculas (estudiante_id, curso_id) VALUES (?, ?)
    `).run(estudiante_id, curso_id);

    res.status(201).json({ id: result.lastInsertRowid, mensaje: 'Matricula creada' });
});

// PATCH /api/matriculas/:id/cancelar — cancelar matricula
router.patch('/:id/cancelar', verificarToken, (req, res) => {
    const matricula = db.prepare('SELECT * FROM matriculas WHERE id = ?').get(req.params.id);

    if (!matricula) {
        return res.status(404).json({ error: 'Matricula no encontrada' });
    }

    // estudiante solo puede cancelar la suya, admin puede cancelar cualquiera
    if (req.usuario.rol === 'estudiante' && matricula.estudiante_id !== req.usuario.id) {
        return res.status(403).json({ error: 'No tienes permiso para cancelar esta matricula' });
    }

    db.prepare("UPDATE matriculas SET estado = 'cancelada' WHERE id = ?").run(req.params.id);
    res.json({ mensaje: 'Matricula cancelada' });
});

module.exports = router;
