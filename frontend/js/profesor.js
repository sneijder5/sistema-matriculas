if (!verificarAcceso('profesor')) { /* redirige */ }

const usuario = getUsuario();
document.getElementById('nombreProfesor').textContent = usuario.nombre;

function mostrarSeccion(nombre) {
    document.querySelectorAll('.seccion').forEach(s => s.classList.remove('activa'));
    document.querySelectorAll('.sidebar nav a').forEach(a => a.classList.remove('activo'));
    document.getElementById(`seccion-${nombre}`).classList.add('activa');
    event.target.classList.add('activo');
    if (nombre === 'reportes') cargarReportes();
}

function cerrarModal(id) {
    document.getElementById(id).classList.add('oculto');
}

// ── CALIFICACIONES ────────────────────────────────────────
async function cargarMaterias() {
    const materias = await apiFetch('/notas/mis-materias');
    const select = document.getElementById('selectMateria');
    select.innerHTML = '<option value="">-- Mis materias --</option>' +
        materias.map(m => `<option value="${m.id}">${m.nombre} (${m.curso})</option>`).join('');
}

async function cargarEstudiantes() {
    const materiaId = document.getElementById('selectMateria').value;
    const contenedor = document.getElementById('tablaCalifContenedor');

    if (!materiaId) { contenedor.style.display = 'none'; return; }

    const estudiantes = await apiFetch(`/notas/materia/${materiaId}`);
    contenedor.style.display = 'block';

    document.getElementById('tablaEstudiantes').innerHTML = estudiantes.map(e => `
        <tr>
            <td>${e.nombre}</td>
            <td>${e.email}</td>
            <td>
                <input type="number" id="nota-${e.id}" value="${e.nota !== null ? e.nota : ''}"
                    min="0" max="5" step="0.1"
                    style="width:80px;padding:6px;border:1px solid #e2e8f0;border-radius:6px">
            </td>
            <td>
                <button class="btn-success" onclick="guardarNota(${e.id}, ${materiaId})">Guardar</button>
                ${e.nota_id ? `<button class="btn-danger" onclick="eliminarNota(${e.nota_id})">Quitar</button>` : ''}
            </td>
        </tr>
    `).join('');
}

async function guardarNota(estudianteId, materiaId) {
    const nota = parseFloat(document.getElementById(`nota-${estudianteId}`).value);
    if (isNaN(nota) || nota < 0 || nota > 5) {
        alert('La nota debe estar entre 0 y 5');
        return;
    }
    try {
        await apiFetch('/notas', { method: 'POST', body: JSON.stringify({ estudiante_id: estudianteId, materia_id: materiaId, nota }) });
        alert('Nota guardada');
        cargarEstudiantes();
    } catch (e) {
        alert(e.message);
    }
}

async function eliminarNota(notaId) {
    if (!confirm('¿Eliminar esta nota?')) return;
    await apiFetch(`/notas/${notaId}`, { method: 'DELETE' });
    cargarEstudiantes();
}

// ── REPORTES ──────────────────────────────────────────────
async function cargarReportes() {
    const reportes = await apiFetch('/reportes');
    const contenedor = document.getElementById('listaReportes');

    if (reportes.length === 0) {
        contenedor.innerHTML = '<div class="card"><p style="color:#94a3b8">No hay reportes.</p></div>';
        return;
    }

    contenedor.innerHTML = reportes.map(r => `
        <div class="card">
            <div style="display:flex;justify-content:space-between;align-items:flex-start">
                <div>
                    <strong>${r.estudiante}</strong> — ${r.materia}
                    <span class="badge badge-${r.estado}" style="margin-left:8px">${r.estado}</span>
                </div>
                <small style="color:#94a3b8">${new Date(r.created_at).toLocaleDateString('es-CO')}</small>
            </div>
            <p style="margin:10px 0;font-size:0.9rem">${r.descripcion}</p>
            ${r.respuesta ? `<div style="background:#f0fdf4;padding:10px;border-radius:8px;font-size:0.85rem"><strong>Tu respuesta:</strong> ${r.respuesta}</div>` : ''}
            ${r.estado === 'pendiente' ? `<button class="btn-primary" style="width:auto;margin-top:10px;padding:6px 16px" onclick="abrirResponder(${r.id}, '${r.descripcion.replace(/'/g,"\\'")}')">Responder</button>` : ''}
        </div>
    `).join('');
}

function abrirResponder(id, descripcion) {
    document.getElementById('reporteId').value = id;
    document.getElementById('descripcionReporte').textContent = descripcion;
    document.getElementById('inputRespuesta').value = '';
    document.getElementById('modalResponder').classList.remove('oculto');
}

async function enviarRespuesta() {
    const id = document.getElementById('reporteId').value;
    const respuesta = document.getElementById('inputRespuesta').value;
    if (!respuesta.trim()) { alert('Escribe una respuesta'); return; }
    await apiFetch(`/reportes/${id}/responder`, { method: 'PATCH', body: JSON.stringify({ respuesta }) });
    cerrarModal('modalResponder');
    cargarReportes();
}

cargarMaterias();
