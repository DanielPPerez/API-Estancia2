// test-simple.js - Script simple para verificar carga de modelos
const db = require('./app/models');

async function testModels() {
  try {
    console.log('🧪 Probando carga de modelos...');
    
    // Verificar conexión
    await db.sequelize.authenticate();
    console.log('✅ Conexión exitosa');
    
    // Listar modelos disponibles
    const modelNames = Object.keys(db).filter(key => 
      key !== 'sequelize' && key !== 'Sequelize'
    );
    console.log('📋 Modelos cargados:', modelNames);
    
    // Verificar modelos específicos
    console.log('\n🔍 Verificando modelos:');
    console.log('- db.user:', !!db.user);
    console.log('- db.users:', !!db.users);
    console.log('- db.role:', !!db.role);
    console.log('- db.roles:', !!db.roles);
    console.log('- db.user_roles:', !!db.user_roles);
    console.log('- db.refreshToken:', !!db.refreshToken);
    
    // Verificar métodos
    if (db.roles || db.role) {
      const Role = db.roles || db.role;
      console.log('- Role.findOrCreate:', typeof Role.findOrCreate);
    }
    
    if (db.users || db.user) {
      const User = db.users || db.user;
      console.log('- User.findOrCreate:', typeof User.findOrCreate);
    }
    
    console.log('\n🎉 Prueba completada');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

testModels(); 