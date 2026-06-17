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

    // sembrar usuarios de prueba (uno por rol) para facilitar las pruebas
    const usuariosPrueba = [
        { nombre: 'Administrador',    email: 'admin@matriculas.com',   password: 'admin123', rol: 'administrador' },
        { nombre: 'Carlos Profesor',  email: 'carlos@uniajc.edu.co',   password: 'prof123',  rol: 'profesor' },
        { nombre: 'Maria Estudiante', email: 'maria@uniajc.edu.co',    password: 'est123',   rol: 'estudiante' },
        { nombre: 'Soporte Tecnico',  email: 'soporte@uniajc.edu.co',  password: 'sop123',   rol: 'soporte' }
    ];

    const insertUsuario = statement("INSERT INTO usuarios (nombre, email, password, rol) VALUES (?, ?, ?, ?)");
    const buscarUsuario = statement("SELECT id FROM usuarios WHERE email = ?");

    for (const u of usuariosPrueba) {
        if (!buscarUsuario.get(u.email)) {
            insertUsuario.run(u.nombre, u.email, bcrypt.hashSync(u.password, 10), u.rol);
            console.log(`Usuario creado [${u.rol}]: ${u.email} / ${u.password}`);
        }
    }

    save();
}

module.exports = db;
module.exports.initDB = initDB;
