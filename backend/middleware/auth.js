const jwt = require('jsonwebtoken');

function verificarToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Acceso denegado, token requerido' });
    }

    try {
        const datos = jwt.verify(token, process.env.JWT_SECRET);
        req.usuario = datos;
        next();
    } catch (err) {
        res.status(403).json({ error: 'Token invalido o expirado' });
    }
}

function soloAdmin(req, res, next) {
    if (req.usuario.rol !== 'administrador') {
        return res.status(403).json({ error: 'Solo el administrador puede hacer esto' });
    }
    next();
}

function soloProfesor(req, res, next) {
    if (req.usuario.rol !== 'profesor' && req.usuario.rol !== 'administrador') {
        return res.status(403).json({ error: 'Solo profesores pueden acceder' });
    }
    next();
}

module.exports = { verificarToken, soloAdmin, soloProfesor };
