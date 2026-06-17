const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { verificarToken } = require('../middleware/auth');

// GET /api/reportes — listar reportes segun el rol
router.get('/', verificarToken, (req, res) => {
    const { rol, id } = req.usuario;

    let reportes;

    if (rol === 'estudiante') {
        reportes = db.prepare(`
            SELECT r.*, m.nombre as materia
            FROM reportes r
            JOIN materias m ON r.materia_id = m.id
            WHERE r.estudiante_id = ?
            ORDER BY r.created_at DESC
        `).all(id);
    } else if (rol === 'profesor') {
        reportes = db.prepare(`
            SELECT r.*, m.nombre as materia, u.nombre as estudiante
            FROM reportes r
            JOIN materias m ON r.materia_id = m.id
            JOIN usuarios u ON r.estudiante_id = u.id
            WHERE m.profesor_id = ?
            ORDER BY r.created_at DESC
        `).all(id);
    } else {
        // admin y soporte ven todos
        reportes = db.prepare(`
            SELECT r.*, m.nombre as materia, u.nombre as estudiante
            FROM reportes r
            JOIN materias m ON r.materia_id = m.id
            JOIN usuarios u ON r.estudiante_id = u.id
            ORDER BY r.created_at DESC
        `).all();
    }

    res.json(reportes);
});

// GET /api/reportes/pendientes — solo pendientes (soporte y admin)
router.get('/pendientes', verificarToken, (req, res) => {
    const reportes = db.prepare(`
        SELECT r.*, m.nombre as materia, u.nombre as estudiante
        FROM reportes r
        JOIN materias m ON r.materia_id = m.id
        JOIN usuarios u ON r.estudiante_id = u.id
        WHERE r.estado = 'pendiente'
        ORDER BY r.created_at ASC
    `).all();
    res.json(reportes);
});

// GET /api/reportes/sin-notas — materias sin ninguna nota registrada (soporte)
router.get('/sin-notas', verificarToken, (req, res) => {
    const materias = db.prepare(`
        SELECT m.id, m.nombre as materia, c.nombre as curso, u.nombre as profesor
        FROM materias m
        JOIN cursos c ON m.curso_id = c.id
        LEFT JOIN usuarios u ON m.profesor_id = u.id
        WHERE m.id NOT IN (SELECT DISTINCT materia_id FROM notas)
    `).all();
    res.json(materias);
});

// POST /api/reportes — crear reporte (estudiante)
router.post('/', verificarToken, (req, res) => {
    if (req.usuario.rol !== 'estudiante') {
        return res.status(403).json({ error: 'Solo estudiantes pueden crear reportes' });
    }

    const { materia_id, descripcion } = req.body;
    if (!materia_id || !descripcion) {
        return res.status(400).json({ error: 'Materia y descripcion son requeridos' });
    }

    const result = db.prepare(`
        INSERT INTO reportes (estudiante_id, materia_id, descripcion) VALUES (?, ?, ?)
    `).run(req.usuario.id, materia_id, descripcion);

    res.status(201).json({ id: result.lastInsertRowid, mensaje: 'Reporte enviado' });
});

// PATCH /api/reportes/:id/responder — responder reporte (profesor)
router.patch('/:id/responder', verificarToken, (req, res) => {
    if (req.usuario.rol !== 'profesor' && req.usuario.rol !== 'administrador') {
        return res.status(403).json({ error: 'Solo profesores pueden responder reportes' });
    }

    const { respuesta } = req.body;
    if (!respuesta) return res.status(400).json({ error: 'La respuesta no puede estar vacia' });

    db.prepare(`
        UPDATE reportes SET respuesta = ?, estado = 'resuelto' WHERE id = ?
    `).run(respuesta, req.params.id);

    res.json({ mensaje: 'Reporte respondido' });
});

module.exports = router;
