# Sistema de Matrículas Académicas

Proyecto de curso — Ingeniería de Software I  
Universidad Antonio José Camacho — Grupo 441A

## Integrantes
- Sofía Olave Villa
- Brandon Esneider López Quinchua
- Santiago Naranjo Alba

## Descripción
Plataforma web para digitalizar la gestión académica de instituciones educativas. Permite administrar usuarios, cursos, calificaciones y matrículas mediante un sistema de roles.

## Roles del sistema
- **Administrador:** gestiona usuarios, cursos y materias
- **Profesor:** ingresa y modifica calificaciones, responde reportes
- **Estudiante:** consulta notas, estado de matrícula, crea reportes
- **Soporte:** audita reclamos y asignaturas sin notas

## Tecnologías
- **Backend:** Node.js + Express + SQLite
- **Frontend:** HTML + CSS + JavaScript (vanilla)
- **Autenticación:** JWT + bcrypt

## Instalación

```bash
cd backend
npm install
cp .env.example .env
npm start
```

Luego abrir `http://localhost:3000` en el navegador.

## Usuarios de prueba

Al iniciar el servidor por primera vez se crean automáticamente los 4 usuarios de prueba (uno por cada rol) para facilitar la verificación del sistema:

| Rol | Email | Contraseña |
|-----|-------|-----------|
| Administrador | `admin@matriculas.com` | `admin123` |
| Profesor | `carlos@uniajc.edu.co` | `prof123` |
| Estudiante | `maria@uniajc.edu.co` | `est123` |
| Soporte | `soporte@uniajc.edu.co` | `sop123` |

> **Nota:** En la versión final solo el administrador puede crear, editar o desactivar usuarios. Estas credenciales están precargadas únicamente con fines académicos para que el evaluador pueda probar cada panel rápidamente sin pasos previos.
