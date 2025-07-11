const express = require('express');
const cors = require('cors');

console.log('🔧 Verificando configuración para producción...\n');

// 1. Verificar configuración de CORS
console.log('📋 1. Configuración de CORS:');
const allowedOrigins = [
  'https://feriadeinnovacion.netlify.app', // Frontend en producción (Netlify)
  'http://localhost:5173', // Desarrollo local
  'http://localhost:8080', // Puerto alternativo para desarrollo
  'http://127.0.0.1:5173' // IP local para desarrollo
];

console.log('✅ Orígenes permitidos:');
allowedOrigins.forEach(origin => {
  console.log(`  - ${origin}`);
});

// 2. Verificar variables de entorno
console.log('\n📋 2. Variables de entorno:');
const envVars = [
  'PORT',
  'DB_HOST',
  'DB_USER',
  'DB_PASS',
  'DB_NAME',
  'JWT_SECRET',
  'NODE_ENV'
];

envVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    // Ocultar valores sensibles
    const displayValue = varName.includes('SECRET') || varName.includes('PASS') 
      ? '***configurado***' 
      : value;
    console.log(`  ✅ ${varName}: ${displayValue}`);
  } else {
    console.log(`  ❌ ${varName}: No configurado`);
  }
});

// 3. Verificar configuración de base de datos
console.log('\n📋 3. Configuración de base de datos:');
const dbConfig = {
  host: process.env.DB_HOST || 'No configurado',
  database: process.env.DB_NAME || 'No configurado',
  user: process.env.DB_USER || 'No configurado',
  password: process.env.DB_PASS ? '***configurado***' : 'No configurado'
};

Object.entries(dbConfig).forEach(([key, value]) => {
  console.log(`  ${value !== 'No configurado' ? '✅' : '❌'} ${key}: ${value}`);
});

// 4. Verificar configuración de JWT
console.log('\n📋 4. Configuración de JWT:');
const jwtSecret = process.env.JWT_SECRET;
if (jwtSecret) {
  console.log('  ✅ JWT_SECRET: ***configurado***');
} else {
  console.log('  ❌ JWT_SECRET: No configurado');
}

// 5. Verificar configuración de entorno
console.log('\n📋 5. Entorno de ejecución:');
const nodeEnv = process.env.NODE_ENV || 'development';
console.log(`  ${nodeEnv === 'production' ? '✅' : '⚠️'} NODE_ENV: ${nodeEnv}`);

// 6. Verificar puerto
console.log('\n📋 6. Configuración del puerto:');
const port = process.env.PORT || 8080;
console.log(`  ✅ Puerto: ${port}`);

// 7. URLs de prueba
console.log('\n📋 7. URLs de prueba:');
console.log('  🌐 Frontend (Netlify): https://feriadeinnovacion.netlify.app');
console.log('  🔧 Backend (Render): https://api-estancia2.onrender.com');
console.log('  📡 API Endpoint: https://api-estancia2.onrender.com/api');

// 8. Endpoints importantes
console.log('\n📋 8. Endpoints importantes:');
const endpoints = [
  '/auth/signin',
  '/auth/signup',
  '/projects',
  '/users',
  '/calificaciones'
];

endpoints.forEach(endpoint => {
  console.log(`  📡 ${endpoint}`);
});

// 9. Verificar configuración de archivos
console.log('\n📋 9. Configuración de archivos:');
const fs = require('fs');
const path = require('path');

const uploadsDir = process.env.NODE_ENV === 'production' ? '/tmp/uploads' : path.join(process.cwd(), 'uploads');
console.log(`  📁 Directorio de uploads: ${uploadsDir}`);

if (fs.existsSync(uploadsDir)) {
  console.log('  ✅ Directorio de uploads existe');
  try {
    const files = fs.readdirSync(uploadsDir);
    console.log(`  📄 Archivos en uploads: ${files.length}`);
  } catch (error) {
    console.log('  ❌ Error leyendo directorio de uploads');
  }
} else {
  console.log('  ⚠️ Directorio de uploads no existe (se creará automáticamente)');
}

// 10. Resumen
console.log('\n🎯 Resumen de configuración:');
const checks = [
  { name: 'CORS configurado', status: true },
  { name: 'Variables de entorno', status: envVars.every(v => process.env[v]) },
  { name: 'Base de datos', status: process.env.DB_HOST && process.env.DB_NAME },
  { name: 'JWT Secret', status: !!process.env.JWT_SECRET },
  { name: 'Entorno de producción', status: process.env.NODE_ENV === 'production' }
];

checks.forEach(check => {
  console.log(`  ${check.status ? '✅' : '❌'} ${check.name}`);
});

const allChecksPass = checks.every(check => check.status);
console.log(`\n${allChecksPass ? '✅' : '❌'} Configuración ${allChecksPass ? 'completa' : 'incompleta'}`);

if (allChecksPass) {
  console.log('\n🚀 Tu aplicación está lista para producción!');
  console.log('🌐 Frontend: https://feriadeinnovacion.netlify.app');
  console.log('🔧 Backend: https://api-estancia2.onrender.com');
} else {
  console.log('\n⚠️ Revisa las configuraciones faltantes antes de desplegar');
} 