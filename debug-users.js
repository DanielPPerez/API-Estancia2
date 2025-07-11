console.log('🔍 Debuggeando modelo de usuarios...');

try {
  const db = require('./app/models');
  
  console.log('\n📋 Modelos disponibles:');
  const modelNames = Object.keys(db).filter(key => 
    key !== 'sequelize' && key !== 'Sequelize'
  );
  console.log(modelNames);
  
  console.log('\n🔍 Verificando modelo usuarios:');
  console.log('db.user:', !!db.user);
  console.log('db.users:', !!db.users);
  
  if (db.user) {
    console.log('✅ Modelo user encontrado');
    console.log('  - Nombre:', db.user.name);
    console.log('  - Tabla:', db.user.tableName);
  }
  
  if (db.users) {
    console.log('✅ Modelo users encontrado');
    console.log('  - Nombre:', db.users.name);
    console.log('  - Tabla:', db.users.tableName);
  }
  
  console.log('\n🔍 Verificando modelo roles:');
  console.log('db.role:', !!db.role);
  console.log('db.roles:', !!db.roles);
  
  if (db.role) {
    console.log('✅ Modelo role encontrado');
    console.log('  - Nombre:', db.role.name);
    console.log('  - Tabla:', db.role.tableName);
  }
  
  if (db.roles) {
    console.log('✅ Modelo roles encontrado');
    console.log('  - Nombre:', db.roles.name);
    console.log('  - Tabla:', db.roles.tableName);
  }
  
  // Probar una consulta simple
  console.log('\n🧪 Probando consulta de usuarios...');
  try {
    const users = await db.users.findAll({
      limit: 3,
      attributes: ['id', 'username', 'email']
    });
    console.log(`✅ Consulta exitosa. Encontrados ${users.length} usuarios`);
  } catch (error) {
    console.error('❌ Error en consulta de usuarios:', error.message);
  }
  
  console.log('\n✅ Debug completado');
  
} catch (error) {
  console.error('❌ Error durante el debug:', error);
  console.error('Stack trace:', error.stack);
} 