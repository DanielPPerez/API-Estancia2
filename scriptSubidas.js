const fetch = require('node-fetch');

const API_BASE = 'https://api-estancia2.onrender.com/api';
const USERNAME = 'Claudia Madariaga';
const PASSWORD = 'Claudia2025!';

async function login() {
  const res = await fetch(`${API_BASE}/auth/signin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: USERNAME, password: PASSWORD })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Error al iniciar sesión');
  return data.accessToken;
}

async function crearProyecto(token) {
  const proyecto = {
    nombreProyecto: 'Proyecto automático',
    descripcion: 'Creado automáticamente para mantener el servidor activo',
    videoPitch: 'https://youtu.be/ejemplo'
  };
  const res = await fetch(`${API_BASE}/projects`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-access-token': token
    },
    body: JSON.stringify(proyecto)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Error al crear proyecto');
  return data.id;
}

async function borrarProyecto(token, id) {
  const res = await fetch(`${API_BASE}/projects/${id}`, {
    method: 'DELETE',
    headers: { 'x-access-token': token }
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Error al borrar proyecto');
  return data;
}

async function main() {
  try {
    console.log('Iniciando sesión...');
    const token = await login();
    console.log('Token obtenido:', token);

    console.log('Creando proyecto...');
    const idProyecto = await crearProyecto(token);
    console.log('Proyecto creado con ID:', idProyecto);

    // Espera 10 segundos antes de borrar (puedes ajustar el tiempo)
    await new Promise(res => setTimeout(res, 10000));

    console.log('Eliminando proyecto...');
    const resultado = await borrarProyecto(token, idProyecto);
    console.log('Proyecto eliminado:', resultado);

  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Ejecutar cada 10 minutos
setInterval(main, 10 * 60 * 1000);
// Ejecutar la primera vez inmediatamente
main();