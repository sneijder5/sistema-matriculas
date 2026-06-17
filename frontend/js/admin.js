if (!verificarAcceso('administrador')) { /* redirige automáticamente */ }

const usuario = getUsuario();
document.getElementById('nombreAdmin').textContent = usuario.nombre;

function mostrarSeccion(nombre) {
    document.querySelectorAll('.seccion').forEach(s => s.classList.remove('activa'));
    document.querySelectorAll('.sidebar nav a').forEach(a => a.classList.remove('activo'));
    document.getElementById(`seccion-${nombre}`).classList.add('activa');
    event.target.classList.add('activo');

    if (nombre === 'usuarios') cargarUsuarios();
    if (nombre === 'cursos') cargarCursos();
    if (nombre === 'matriculas') cargarMatriculas();
}

function cerrarModal(id) {
    document.getElementById(id).classList.add('oculto');
}

// ── USUARIOS ──────────────────────────────────────────────
async function cargarUsuarios() {
    try {
        const usuarios = await apiFetch('/usuarios');
        const tbody = document.getElementById('tablaUsuarios');
        tbody.innerHTML = usuarios.map(u => `
            <tr>
                <td>${u.nombre}</td>
                <td>${u.email}</td>
                <td>${u.rol}</td>
                <td><span class="badge badge-${u.activo ? 'activo' : 'inactivo'}">${u.activo ? 'Activo' : 'Inactivo'}</span></td>
                <td>
                    <button class="btn-sm" onclick="editarUsuario(${u.id},'${u.nombre}','${u.email}','${u.rol}')">Editar</button>
                    <button class="btn-sm" onclick="cambiarEstado(${u.id}, ${u.activo ? 0 : 1})">${u.activo ? 'Inactivar' : 'Activar'}</button>
                    <button class="btn-danger" onclick="eliminarUsuario(${u.id})">Eliminar</button>
                </td>
            </tr>
        `).join('');
    } catch (e) {
        console.error(e);
    }
}

function abrirModalUsuario() {
    document.getElementById('tituloModalUsuario').textContent = 'Nuevo Usuario';
    document.getElementById('usuarioId').value = '';
    document.getElementById('inputNombre').value = '';
    document.getElementById('inputEmail').value = '';
    document.getElementById('inputPassword').value = '';
    document.getElementById('inputRol').value = 'estudiante';
    document.getElementById('errorModalUsuario').classList.add('oculto');
    document.getElementById('modalUsuario').classList.remove('oculto');
}

function editarUsuario(id, nombre, email, rol) {
    document.getElementById('tituloModalUsuario').textContent = 'Editar Usuario';
    document.getElementById('usuarioId').value = id;
    document.getElementById('inputNombre').value = nombre;
    document.getElementById('inputEmail').value = email;
    document.getElementById('inputRol').value = rol;
    document.getElementById('inputPassword').value = '';
    document.getElementById('modalUsuario').classList.remove('oculto');
}

async function guardarUsuario() {
    const id = document.getElementById('usuarioId').value;
    const body = {
        nombre: document.getElementById('inputNombre').value,
        email: document.getElementById('inputEmail').value,
        rol: document.getElementById('inputRol').value,
        password: document.getElementById('inputPassword').value
    };

    const errorDiv = document.getElementById('errorModalUsuario');
    try {
        if (id) {
            await apiFetch(`/usuarios/${id}`, { method: 'PUT', body: JSON.stringify(body) });
        } else {
            if (!body.password) { errorDiv.textContent = 'La contraseña es requerida'; errorDiv.classList.remove('oculto'); return; }
            await apiFetch('/usuarios', { method: 'POST', body: JSON.stringify(body) });
        }
        cerrarModal('modalUsuario');
        cargarUsuarios();
    } catch (e) {
        errorDiv.textContent = e.message;
        errorDiv.classList.remove('oculto');
    }
}

async function cambiarEstado(id, nuevoEstado) {
    await apiFetch(`/usuarios/${id}/estado`, { method: 'PATCH', body: JSON.stringify({ activo: nuevoEstado }) });
    cargarUsuarios();
}

async function eliminarUsuario(id) {
    if (!confirm('¿Seguro que deseas eliminar este usuario?')) return;
    await apiFetch(`/usuarios/${id}`, { method: 'DELETE' });
    cargarUsuarios();
}

// ── CURSOS ────────────────────────────────────────────────
async function cargarCursos() {
    const cursos = await apiFetch('/cursos');
    const contenedor = document.getElementById('listaCursos');
    contenedor.innerHTML = cursos.map(c => `
        <div class="card">
            <div style="display:flex;justify-content:space-between;align-items:center">
                <h3>${c.nombre}</h3>
                <div style="display:flex;gap:8px">
                    <button class="btn-sm" onclick="abrirModalMateria(${c.id})">+ Materia</button>
                    <button class="btn-danger" onclick="eliminarCurso(${c.id})">Eliminar</button>
                </div>
            </div>
            <p style="color:#64748b;font-size:0.85rem;margin:6px 0 12px">${c.descripcion || ''}</p>
            <div id="materias-${c.id}"></div>
        </div>
    `).join('');

    for (const c of cursos) {
        cargarMateriasCurso(c.id);
    }
}

async function cargarMateriasCurso(cursoId) {
    const materias = await apiFetch(`/cursos/${cursoId}/materias`);
    const contenedor = document.getElementById(`materias-${cursoId}`);
    if (materias.length === 0) {
        contenedor.innerHTML = '<p style="color:#94a3b8;font-size:0.85rem">Sin materias aún</p>';
        return;
    }
    contenedor.innerHTML = `
        <table><thead><tr><th>Materia</th><th>Profesor</th><th></th></tr></thead>
        <tbody>${materias.map(m => `
            <tr>
                <td>${m.nombre}</td>
                <td>${m.profesor_nombre || 'Sin asignar'}</td>
                <td><button class="btn-danger" onclick="eliminarMateria(${m.id},${cursoId})">Eliminar</button></td>
            </tr>
        `).join('')}</tbody></table>
    `;
}

function abrirModalCurso() {
    document.getElementById('inputNombreCurso').value = '';
    document.getElementById('inputDescCurso').value = '';
    document.getElementById('modalCurso').classList.remove('oculto');
}

async function guardarCurso() {
    const nombre = document.getElementById('inputNombreCurso').value;
    if (!nombre) return;
    await apiFetch('/cursos', { method: 'POST', body: JSON.stringify({ nombre, descripcion: document.getElementById('inputDescCurso').value }) });
    cerrarModal('modalCurso');
    cargarCursos();
}

async function eliminarCurso(id) {
    if (!confirm('¿Eliminar este curso?')) return;
    await apiFetch(`/cursos/${id}`, { method: 'DELETE' });
    cargarCursos();
}

async function abrirModalMateria(cursoId) {
    document.getElementById('cursoIdMateria').value = cursoId;
    document.getElementById('inputNombreMateria').value = '';
    const profesores = await apiFetch('/cursos/profesores/lista');
    const select = document.getElementById('inputProfesorMateria');
    select.innerHTML = '<option value="">Sin asignar</option>' + profesores.map(p => `<option value="${p.id}">${p.nombre}</option>`).join('');
    document.getElementById('modalMateria').classList.remove('oculto');
}

async function guardarMateria() {
    const cursoId = document.getElementById('cursoIdMateria').value;
    const nombre = document.getElementById('inputNombreMateria').value;
    const profesor_id = document.getElementById('inputProfesorMateria').value;
    if (!nombre) return;
    await apiFetch(`/cursos/${cursoId}/materias`, { method: 'POST', body: JSON.stringify({ nombre, profesor_id: profesor_id || null }) });
    cerrarModal('modalMateria');
    cargarMateriasCurso(cursoId);
}

async function eliminarMateria(id, cursoId) {
    if (!confirm('¿Eliminar esta materia?')) return;
    await apiFetch(`/cursos/materias/${id}`, { method: 'DELETE' });
    cargarMateriasCurso(cursoId);
}

// ── MATRÍCULAS ────────────────────────────────────────────
async function cargarMatriculas() {
    const matriculas = await apiFetch('/matriculas');
    const tbody = document.getElementById('tablaMatriculas');
    tbody.innerHTML = matriculas.map(m => `
        <tr>
            <td>${m.estudiante}</td>
            <td>${m.curso}</td>
            <td><span class="badge badge-${m.estado}">${m.estado}</span></td>
            <td>${new Date(m.fecha_inicio).toLocaleDateString('es-CO')}</td>
            <td>${m.estado === 'activa' ? `<button class="btn-danger" onclick="cancelarMatricula(${m.id})">Cancelar</button>` : ''}</td>
        </tr>
    `).join('');
}

async function abrirModalMatricula() {
    const [usuarios, cursos] = await Promise.all([apiFetch('/usuarios'), apiFetch('/cursos')]);
    const estudiantes = usuarios.filter(u => u.rol === 'estudiante' && u.activo);

    document.getElementById('selectEstudiante').innerHTML = estudiantes.map(e => `<option value="${e.id}">${e.nombre}</option>`).join('');
    document.getElementById('selectCursoMatricula').innerHTML = cursos.map(c => `<option value="${c.id}">${c.nombre}</option>`).join('');
    document.getElementById('modalMatricula').classList.remove('oculto');
}

async function guardarMatricula() {
    const estudiante_id = document.getElementById('selectEstudiante').value;
    const curso_id = document.getElementById('selectCursoMatricula').value;
    const errorDiv = document.getElementById('errorModalMatricula');
    try {
        await apiFetch('/matriculas', { method: 'POST', body: JSON.stringify({ estudiante_id, curso_id }) });
        cerrarModal('modalMatricula');
        cargarMatriculas();
    } catch (e) {
        errorDiv.textContent = e.message;
        errorDiv.classList.remove('oculto');
    }
}

async function cancelarMatricula(id) {
    if (!confirm('¿Cancelar esta matrícula?')) return;
    await apiFetch(`/matriculas/${id}/cancelar`, { method: 'PATCH' });
    cargarMatriculas();
}

// carga inicial
cargarUsuarios();
