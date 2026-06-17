if (!verificarAcceso('soporte')) { /* redirige */ }

const usuario = getUsuario();
document.getElementById('nombreSoporte').textContent = usuario.nombre;

function mostrarSeccion(nombre) {
    document.querySelectorAll('.seccion').forEach(s => s.classList.remove('activa'));
    document.querySelectorAll('.sidebar nav a').forEach(a => a.classList.remove('activo'));
    document.getElementById(`seccion-${nombre}`).classList.add('activa');
    event.target.classList.add('activo');
    if (nombre === 'pendientes') cargarPendientes();
    if (nombre === 'resueltos') cargarResueltos();
    if (nombre === 'sin-notas') cargarSinNotas();
}

function renderReportes(reportes, contenedorId, mostrarRespuesta) {
    const contenedor = document.getElementById(contenedorId);
    if (reportes.length === 0) {
        contenedor.innerHTML = '<div class="card"><p style="color:#94a3b8">No hay reportes en esta categoría.</p></div>';
        return;
    }

    contenedor.innerHTML = reportes.map(r => `
        <div class="card">
            <div style="display:flex;justify-content:space-between;align-items:flex-start">
                <div>
                    <strong>${r.estudiante}</strong> — <span style="color:#64748b">${r.materia}</span>
                    <span class="badge badge-${r.estado}" style="margin-left:8px">${r.estado}</span>
                </div>
                <small style="color:#94a3b8">${new Date(r.created_at).toLocaleDateString('es-CO')}</small>
            </div>
            <p style="margin:10px 0;font-size:0.9rem">${r.descripcion}</p>
            ${mostrarRespuesta && r.respuesta ? `
                <div style="background:#f0fdf4;padding:10px;border-radius:8px;font-size:0.85rem">
                    <strong>Respuesta del profesor:</strong> ${r.respuesta}
                </div>
            ` : ''}
        </div>
    `).join('');
}

async function cargarPendientes() {
    const reportes = await apiFetch('/reportes/pendientes');
    renderReportes(reportes, 'listaPendientes', false);
}

async function cargarResueltos() {
    const todos = await apiFetch('/reportes');
    const resueltos = todos.filter(r => r.estado === 'resuelto');
    renderReportes(resueltos, 'listaResueltos', true);
}

async function cargarSinNotas() {
    const materias = await apiFetch('/reportes/sin-notas');
    const tbody = document.getElementById('tablaSinNotas');
    if (materias.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;color:#94a3b8">Todas las materias tienen notas registradas</td></tr>';
        return;
    }
    tbody.innerHTML = materias.map(m => `
        <tr>
            <td>${m.materia}</td>
            <td>${m.curso}</td>
            <td>${m.profesor || 'Sin asignar'}</td>
        </tr>
    `).join('');
}

cargarPendientes();
