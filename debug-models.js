// debug-models.js - Script para debuggear la carga de modelos
const db = require('./app/models');

async function debugModels() {
  try {
    console.log('🔍 Debuggeando carga de modelos...');
    
    // 1. Verificar conexión
    await db.sequelize.authenticate();
    console.log('✅ Conexión a la base de datos exitosa');
    
    // 2. Listar todos los modelos disponibles
    const modelNames = Object.keys(db).filter(key => 
      key !== 'sequelize' && key !== 'Sequelize'
    );
    console.log('📋 Modelos cargados:', modelNames);
    
    // 3. Verificar cada modelo específicamente
    console.log('\n🔍 Verificando modelos específicos:');
    
    if (db.user) {
      console.log('✅ db.user está disponible');
    } else {
      console.log('❌ db.user NO está disponible');
    }
    
    if (db.role) {
      console.log('✅ db.role está disponible');
    } else {
      console.log('❌ db.role NO está disponible');
    }
    
    if (db.user_roles) {
      console.log('✅ db.user_roles está disponible');
    } else {
      console.log('❌ db.user_roles NO está disponible');
    }
    
    if (db.proyecto) {
      console.log('✅ db.proyecto está disponible');
    } else {
      console.log('❌ db.proyecto NO está disponible');
    }
    
    if (db.calificaciones) {
      console.log('✅ db.calificaciones está disponible');
    } else {
      console.log('❌ db.calificaciones NO está disponible');
    }
    
    if (db.refreshToken) {
      console.log('✅ db.refreshToken está disponible');
    } else {
      console.log('❌ db.refreshToken NO está disponible');
    }
    
    // 4. Verificar métodos de los modelos
    console.log('\n🔍 Verificando métodos de modelos:');
    
    if (db.role && typeof db.role.findOrCreate === 'function') {
      console.log('✅ db.role.findOrCreate está disponible');
    } else {
      console.log('❌ db.role.findOrCreate NO está disponible');
    }
    
    if (db.user && typeof db.user.findOrCreate === 'function') {
      console.log('✅ db.user.findOrCreate está disponible');
    } else {
      console.log('❌ db.user.findOrCreate NO está disponible');
    }
    
    // 5. Intentar crear un rol de prueba
    console.log('\n🧪 Probando creación de rol...');
    
    if (db.role) {
      try {
        const testRole = await db.role.findOrCreate({
          where: { name: 'test_role' },
          defaults: { name: 'test_role' }
        });
        console.log('✅ Creación de rol exitosa');
        
        // Limpiar el rol de prueba
        await testRole[0].destroy();
        console.log('✅ Rol de prueba eliminado');
      } catch (error) {
        console.error('❌ Error al crear rol de prueba:', error);
      }
    }
    
    console.log('\n🎉 Debug completado');
    
  } catch (error) {
    console.error('❌ Error en debug:', error);
  } finally {
    process.exit(0);
  }
}

debugModels(); 