document.getElementById('formLogin').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('mensajeError');
    const btn = document.getElementById('btnLogin');

    btn.disabled = true;
    btn.textContent = 'Ingresando...';
    errorDiv.classList.add('oculto');

    try {
        const respuesta = await fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const datos = await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(datos.error);
        }

        localStorage.setItem('token', datos.token);
        localStorage.setItem('usuario', JSON.stringify(datos.usuario));

        const rutas = {
            administrador: '/pages/admin.html',
            profesor: '/pages/profesor.html',
            estudiante: '/pages/estudiante.html',
            soporte: '/pages/soporte.html'
        };

        window.location.href = rutas[datos.usuario.rol] || '/index.html';

    } catch (err) {
        errorDiv.textContent = err.message || 'Error al iniciar sesión';
        errorDiv.classList.remove('oculto');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Iniciar Sesión';
    }
});

document.getElementById('linkRecuperar').addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('formRecuperar').classList.toggle('oculto');
});

document.getElementById('btnRecuperar').addEventListener('click', async () => {
    const email = document.getElementById('emailRecuperar').value;
    const msgDiv = document.getElementById('mensajeRecuperar');

    if (!email) return;

    try {
        await fetch('http://localhost:3000/api/auth/recuperar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        msgDiv.textContent = 'Si el correo existe, recibirás las instrucciones pronto';
        msgDiv.className = 'success-msg';
    } catch {
        msgDiv.textContent = 'Error al enviar, intenta de nuevo';
        msgDiv.className = 'error-msg';
    }
    msgDiv.classList.remove('oculto');
});
