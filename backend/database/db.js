const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const db = new Database(path.join(__dirname, 'matriculas.db'));

// habilitar claves foraneas
db.pragma('foreign_keys = ON');

function inicializarDB() {
    db.exec(`
        CREATE TABLE IF NOT EXISTS usuarios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            rol TEXT NOT NULL CHECK(rol IN ('administrador', 'profesor', 'estudiante', 'soporte')),
            activo INTEGER NOT NULL DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS cursos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre TEXT NOT NULL,
            descripcion TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS materias (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre TEXT NOT NULL,
            curso_id INTEGER,
            profesor_id INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (curso_id) REFERENCES cursos(id),
            FOREIGN KEY (profesor_id) REFERENCES usuarios(id)
        );

        CREATE TABLE IF NOT EXISTS matriculas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            estudiante_id INTEGER NOT NULL,
            curso_id INTEGER NOT NULL,
            estado TEXT NOT NULL DEFAULT 'activa' CHECK(estado IN ('activa', 'cancelada', 'pendiente')),
            fecha_inicio DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (estudiante_id) REFERENCES usuarios(id),
            FOREIGN KEY (curso_id) REFERENCES cursos(id)
        );

        CREATE TABLE IF NOT EXISTS notas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            estudiante_id INTEGER NOT NULL,
            materia_id INTEGER NOT NULL,
            nota REAL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (estudiante_id) REFERENCES usuarios(id),
            FOREIGN KEY (materia_id) REFERENCES materias(id)
        );

        CREATE TABLE IF NOT EXISTS reportes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            estudiante_id INTEGER NOT NULL,
            materia_id INTEGER NOT NULL,
            descripcion TEXT NOT NULL,
            respuesta TEXT,
            estado TEXT NOT NULL DEFAULT 'pendiente' CHECK(estado IN ('pendiente', 'resuelto')),
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (estudiante_id) REFERENCES usuarios(id),
            FOREIGN KEY (materia_id) REFERENCES materias(id)
        );
    `);

    // crear admin por defecto si no existe
    const adminExiste = db.prepare("SELECT id FROM usuarios WHERE email = ?").get('admin@matriculas.com');
    if (!adminExiste) {
        const hash = bcrypt.hashSync('admin123', 10);
        db.prepare(`
            INSERT INTO usuarios (nombre, email, password, rol) VALUES (?, ?, ?, ?)
        `).run('Administrador', 'admin@matriculas.com', hash, 'administrador');
        console.log('Usuario admin creado: admin@matriculas.com / admin123');
    }
}

inicializarDB();

module.exports = db;
