console.log('🔍 Iniciando debug de modelos...');

try {
  console.log('📦 Cargando modelos...');
  const db = require('./app/models');
  
  console.log('\n📋 Modelos disponibles:');
  Object.keys(db).forEach(key => {
    if (key !== 'sequelize' && key !== 'Sequelize') {
      console.log(`  - ${key}: ${typeof db[key]}`);
    }
  });
  
  console.log('\n🔍 Verificando modelo proyectos específicamente:');
  console.log('db.proyectos:', !!db.proyectos);
  if (db.proyectos) {
    console.log('  - Nombre:', db.proyectos.name);
    console.log('  - Tabla:', db.proyectos.tableName);
    console.log('  - Asociaciones:', Object.keys(db.proyectos.associations || {}));
  }
  
  console.log('\n🔍 Verificando modelo usuarios:');
  console.log('db.users:', !!db.users);
  if (db.users) {
    console.log('  - Nombre:', db.users.name);
    console.log('  - Tabla:', db.users.tableName);
  }
  
  console.log('\n✅ Debug completado');
  
} catch (error) {
  console.error('❌ Error durante el debug:', error);
  console.error('Stack trace:', error.stack);
} 