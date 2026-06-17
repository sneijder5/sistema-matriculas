if (!verificarAcceso('estudiante')) { /* redirige */ }

const usuario = getUsuario();
document.getElementById('nombreEstudiante').textContent = usuario.nombre;

function mostrarSeccion(nombre) {
    document.querySelectorAll('.seccion').forEach(s => s.classList.remove('activa'));
    document.querySelectorAll('.sidebar nav a').forEach(a => a.classList.remove('activo'));
    document.getElementById(`seccion-${nombre}`).classList.add('activa');
    event.target.classList.add('activo');
    if (nombre === 'notas') cargarNotas();
    if (nombre === 'matricula') cargarMatricula();
    if (nombre === 'reportes') cargarReportes();
}

function cerrarModal(id) {
    document.getElementById(id).classList.add('oculto');
}

// ── NOTAS ─────────────────────────────────────────────────
async function cargarNotas() {
    const notas = await apiFetch('/notas/mis-notas');
    const tbody = document.getElementById('tablaNotas');

    if (notas.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:#94a3b8">No tienes notas registradas aún</td></tr>';
        return;
    }

    tbody.innerHTML = notas.map(n => `
        <tr>
            <td>${n.curso}</td>
            <td>${n.materia}</td>
            <td>
                <strong style="font-size:1.1rem;color:${n.nota >= 3 ? '#16a34a' : '#dc2626'}">
                    ${n.nota !== null ? n.nota.toFixed(1) : 'Pendiente'}
                </strong>
            </td>
            <td>${n.updated_at ? new Date(n.updated_at).toLocaleDateString('es-CO') : '-'}</td>
        </tr>
    `).join('');
}

// ── MATRÍCULA ─────────────────────────────────────────────
async function cargarMatricula() {
    const datos = await apiFetch('/matriculas/mi-matricula');
    const contenedor = document.getElementById('infoMatricula');

    if (!datos.id) {
        contenedor.innerHTML = '<p style="color:#94a3b8">No tienes matrícula activa en este momento.</p>';
        return;
    }

    contenedor.innerHTML = `
        <div style="display:grid;gap:12px">
            <div><strong>Curso:</strong> ${datos.curso}</div>
            <div><strong>Estado:</strong> <span class="badge badge-${datos.estado}">${datos.estado}</span></div>
            <div><strong>Fecha de inicio:</strong> ${new Date(datos.fecha_inicio).toLocaleDateString('es-CO')}</div>
            ${datos.estado === 'activa' ? `
                <div>
                    <button class="btn-danger" onclick="cancelarMatricula(${datos.id})">Cancelar Matrícula</button>
                    <p style="color:#94a3b8;font-size:0.8rem;margin-top:6px">Esta acción no se puede deshacer</p>
                </div>
            ` : ''}
        </div>
    `;
}

async function cancelarMatricula(id) {
    if (!confirm('¿Estás seguro de cancelar tu matrícula? Esta acción no se puede deshacer.')) return;
    await apiFetch(`/matriculas/${id}/cancelar`, { method: 'PATCH' });
    alert('Matrícula cancelada');
    cargarMatricula();
}

// ── REPORTES ──────────────────────────────────────────────
async function cargarReportes() {
    const reportes = await apiFetch('/reportes');
    const contenedor = document.getElementById('listaReportes');

    if (reportes.length === 0) {
        contenedor.innerHTML = '<div class="card"><p style="color:#94a3b8">No tienes reportes enviados.</p></div>';
        return;
    }

    contenedor.innerHTML = reportes.map(r => `
        <div class="card">
            <div style="display:flex;justify-content:space-between">
                <strong>${r.materia}</strong>
                <span class="badge badge-${r.estado}">${r.estado}</span>
            </div>
            <p style="margin:10px 0;font-size:0.9rem">${r.descripcion}</p>
            ${r.respuesta ? `
                <div style="background:#eff6ff;padding:10px;border-radius:8px;font-size:0.85rem">
                    <strong>Respuesta del profesor:</strong><br>${r.respuesta}
                </div>
            ` : '<p style="color:#94a3b8;font-size:0.85rem">Esperando respuesta...</p>'}
        </div>
    `).join('');
}

async function abrirModalReporte() {
    const matricula = await apiFetch('/matriculas/mi-matricula');
    if (!matricula.id) {
        alert('Necesitas una matrícula activa para crear reportes');
        return;
    }

    const materias = await apiFetch(`/cursos/${matricula.curso_id}/materias`);
    document.getElementById('selectMateriaReporte').innerHTML = materias.map(m =>
        `<option value="${m.id}">${m.nombre}</option>`
    ).join('');
    document.getElementById('inputDescReporte').value = '';
    document.getElementById('modalReporte').classList.remove('oculto');
}

async function enviarReporte() {
    const materia_id = document.getElementById('selectMateriaReporte').value;
    const descripcion = document.getElementById('inputDescReporte').value;
    const errorDiv = document.getElementById('errorReporte');

    if (!descripcion.trim()) {
        errorDiv.textContent = 'La descripción no puede estar vacía';
        errorDiv.classList.remove('oculto');
        return;
    }

    try {
        await apiFetch('/reportes', { method: 'POST', body: JSON.stringify({ materia_id, descripcion }) });
        cerrarModal('modalReporte');
        cargarReportes();
    } catch (e) {
        errorDiv.textContent = e.message;
        errorDiv.classList.remove('oculto');
    }
}

cargarNotas();
