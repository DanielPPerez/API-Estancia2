// test-server.js - Script para probar el servidor
const db = require('./app/models');
const { setupDatabase } = require('./app/config/initialSetup');

async function testServer() {
  try {
    console.log('🚀 Probando configuración del servidor...');
    
    // Verificar conexión
    await db.sequelize.authenticate();
    console.log('✅ Conexión a la base de datos exitosa');
    
    // Sincronizar modelos
    await db.sequelize.sync({ force: false });
    console.log('✅ Modelos sincronizados');
    
    // Ejecutar configuración inicial
    console.log('🔄 Ejecutando configuración inicial...');
    await setupDatabase();
    console.log('✅ Configuración inicial completada');
    
    console.log('\n🎉 Servidor listo para funcionar');
    
  } catch (error) {
    console.error('❌ Error en prueba del servidor:', error);
  } finally {
    process.exit(0);
  }
}

testServer(); 