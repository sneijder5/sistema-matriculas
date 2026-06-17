const API_URL = 'http://localhost:3000/api';

function getToken() {
    return localStorage.getItem('token');
}

function getUsuario() {
    const data = localStorage.getItem('usuario');
    return data ? JSON.parse(data) : null;
}

function cerrarSesion() {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    window.location.href = '/index.html';
}

async function apiFetch(ruta, opciones = {}) {
    const token = getToken();
    const headers = {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
    };

    const respuesta = await fetch(`${API_URL}${ruta}`, {
        ...opciones,
        headers: { ...headers, ...opciones.headers }
    });

    if (respuesta.status === 401 || respuesta.status === 403) {
        cerrarSesion();
        return;
    }

    const datos = await respuesta.json();

    if (!respuesta.ok) {
        throw new Error(datos.error || 'Error en la solicitud');
    }

    return datos;
}

function verificarAcceso(rolRequerido) {
    const usuario = getUsuario();
    if (!usuario || !getToken()) {
        window.location.href = '/index.html';
        return false;
    }
    if (rolRequerido && usuario.rol !== rolRequerido) {
        alert('No tienes permiso para acceder a esta página');
        cerrarSesion();
        return false;
    }
    return true;
}
