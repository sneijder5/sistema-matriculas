const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_FILE = path.join(__dirname, 'matriculas.db');
let _sqlDb = null;

function save() {
    if (_sqlDb) {
        fs.writeFileSync(DB_FILE, Buffer.from(_sqlDb.export()));
    }
}

function statement(sql) {
    return {
        get(...args) {
            const s = _sqlDb.prepare(sql);
            const params = args.flat();
            if (params.length) s.bind(params);
            const row = s.step() ? s.getAsObject() : undefined;
            s.free();
            return row;
        },
        all(...args) {
            const rows = [];
            const s = _sqlDb.prepare(sql);
            const params = args.flat();
            if (params.length) s.bind(params);
            while (s.step()) rows.push(s.getAsObject());
            s.free();
            return rows;
        },
        run(...args) {
            const s = _sqlDb.prepare(sql);
            const params = args.flat();
            if (params.length) s.bind(params);
            s.step();
            s.free();
            const idResult = _sqlDb.exec("SELECT last_insert_rowid()");
            const lastInsertRowid = idResult[0]?.values[0]?.[0] || 0;
            save();
            return { lastInsertRowid };
        }
    };
}

const db = {
    prepare: (sql) => statement(sql),
    exec: (sql) => { _sqlDb.run(sql); save(); },
    pragma: () => {}
};

async function initDB() {
    const initSqlJs = require('sql.js');
    const SQL = await initSqlJs();

    if (fs.existsSync(DB_FILE)) {
        _sqlDb = new SQL.Database(fs.readFileSync(DB_FILE));
    } else {
        _sqlDb = new SQL.Database();
    }

    _sqlDb.run("PRAGMA foreign_keys = ON");

    _sqlDb.run(`CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        rol TEXT NOT NULL CHECK(rol IN ('administrador', 'profesor', 'estudiante', 'soporte')),
        activo INTEGER NOT NULL DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    _sqlDb.run(`CREATE TABLE IF NOT EXISTS cursos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        descripcion TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    _sqlDb.run(`CREATE TABLE IF NOT EXISTS materias (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        curso_id INTEGER,
        profesor_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (curso_id) REFERENCES cursos(id),
        FOREIGN KEY (profesor_id) REFERENCES usuarios(id)
    )`);

    _sqlDb.run(`CREATE TABLE IF NOT EXISTS matriculas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        estudiante_id INTEGER NOT NULL,
        curso_id INTEGER NOT NULL,
        estado TEXT NOT NULL DEFAULT 'activa' CHECK(estado IN ('activa', 'cancelada', 'pendiente')),
        fecha_inicio DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (estudiante_id) REFERENCES usuarios(id),
        FOREIGN KEY (curso_id) REFERENCES cursos(id)
    )`);

    _sqlDb.run(`CREATE TABLE IF NOT EXISTS notas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        estudiante_id INTEGER NOT NULL,
        materia_id INTEGER NOT NULL,
        nota REAL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (estudiante_id) REFERENCES usuarios(id),
        FOREIGN KEY (materia_id) REFERENCES materias(id)
    )`);

    _sqlDb.run(`CREATE TABLE IF NOT EXISTS reportes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        estudiante_id INTEGER NOT NULL,
        materia_id INTEGER NOT NULL,
        descripcion TEXT NOT NULL,
        respuesta TEXT,
        estado TEXT NOT NULL DEFAULT 'pendiente' CHECK(estado IN ('pendiente', 'resuelto')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (estudiante_id) REFERENCES usuarios(id),
        FOREIGN KEY (materia_id) REFERENCES materias(id)
    )`);

    // crear admin por defecto si no existe
    const adminExiste = statement("SELECT id FROM usuarios WHERE email = ?").get('admin@matriculas.com');
    if (!adminExiste) {
        const hash = bcrypt.hashSync('admin123', 10);
        statement("INSERT INTO usuarios (nombre, email, password, rol) VALUES (?, ?, ?, ?)")
            .run('Administrador', 'admin@matriculas.com', hash, 'administrador');
        console.log('Usuario admin creado: admin@matriculas.com / admin123');
    }

    save();
}

module.exports = db;
module.exports.initDB = initDB;
