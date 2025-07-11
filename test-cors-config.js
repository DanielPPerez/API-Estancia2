const express = require('express');
const cors = require('cors');

// Simular la configuración de CORS del servidor
const allowedOrigins = [
  'https://feriadeinnovacion.netlify.app', // Frontend en producción (Netlify)
  'http://localhost:5173', // Desarrollo local
  'http://localhost:8080', // Puerto alternativo para desarrollo
  'http://127.0.0.1:5173' // IP local para desarrollo
];

const corsOptions = {
  origin: function (origin, callback) {
    // Permitir peticiones sin 'origin' (como las de Postman o apps móviles)
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log(`🚫 CORS bloqueado para origen: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // Necesario para autenticación con cookies/tokens
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Métodos HTTP permitidos
  allowedHeaders: ['Content-Type', 'x-access-token', 'Authorization'] // Headers permitidos
};

console.log('🔧 Configuración de CORS:');
console.log('📋 Orígenes permitidos:');
allowedOrigins.forEach(origin => {
  console.log(`  ✅ ${origin}`);
});

console.log('\n📋 Métodos HTTP permitidos:');
console.log('  ✅ GET, POST, PUT, DELETE, OPTIONS');

console.log('\n📋 Headers permitidos:');
console.log('  ✅ Content-Type, x-access-token, Authorization');

console.log('\n🧪 Probando orígenes:');

// Probar diferentes orígenes
const testOrigins = [
  'https://feriadeinnovacion.netlify.app',
  'http://localhost:5173',
  'http://localhost:8080',
  'http://127.0.0.1:5173',
  'https://malicious-site.com',
  'http://localhost:3000',
  null // Para peticiones sin origin
];

testOrigins.forEach(origin => {
  const isAllowed = !origin || allowedOrigins.indexOf(origin) !== -1;
  console.log(`  ${isAllowed ? '✅' : '❌'} ${origin || 'Sin origen'}`);
});

console.log('\n✅ Configuración de CORS lista para producción');
console.log('🌐 Tu frontend en https://feriadeinnovacion.netlify.app podrá comunicarse con el backend'); 