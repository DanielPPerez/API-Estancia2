console.log('🔍 Verificando corrección del modelo proyectos...');

try {
  const db = require('./app/models');
  
  console.log('\n📋 Modelos disponibles:');
  const modelNames = Object.keys(db).filter(key => 
    key !== 'sequelize' && key !== 'Sequelize'
  );
  console.log(modelNames);
  
  console.log('\n🔍 Verificando modelo proyectos:');
  console.log('db.proyectos:', !!db.proyectos);
  console.log('db.proyecto:', !!db.proyecto);
  console.log('db.projects:', !!db.projects);
  
  if (db.proyectos) {
    console.log('✅ Modelo proyectos encontrado');
    console.log('  - Nombre:', db.proyectos.name);
    console.log('  - Tabla:', db.proyectos.tableName);
  } else {
    console.log('❌ Modelo proyectos NO encontrado');
  }
  
  console.log('\n🔍 Verificando modelo usuarios:');
  console.log('db.users:', !!db.users);
  console.log('db.user:', !!db.user);
  
  if (db.users) {
    console.log('✅ Modelo usuarios encontrado');
    console.log('  - Nombre:', db.users.name);
  }
  
  console.log('\n✅ Verificación completada');
  
} catch (error) {
  console.error('❌ Error:', error.message);
  console.error('Stack:', error.stack);
} 