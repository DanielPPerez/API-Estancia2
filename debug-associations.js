const db = require('./app/models');

async function debugAssociations() {
  try {
    console.log('🔍 Debuggeando asociaciones...');
    
    // Verificar que los modelos estén disponibles
    console.log('\n📋 Modelos disponibles:');
    const modelNames = Object.keys(db).filter(key => 
      key !== 'sequelize' && key !== 'Sequelize'
    );
    console.log(modelNames);
    
    // Verificar asociaciones de proyectos
    if (db.proyectos) {
      console.log('\n🔍 Asociaciones de proyectos:');
      console.log('db.proyectos.associations:', !!db.proyectos.associations);
      if (db.proyectos.associations) {
        console.log('Asociaciones:', Object.keys(db.proyectos.associations));
        console.log('Asociación user:', !!db.proyectos.associations.user);
      }
    }
    
    // Verificar asociaciones de usuarios
    if (db.users) {
      console.log('\n🔍 Asociaciones de usuarios:');
      console.log('db.users.associations:', !!db.users.associations);
      if (db.users.associations) {
        console.log('Asociaciones:', Object.keys(db.users.associations));
        console.log('Asociación proyectos:', !!db.users.associations.proyectos);
      }
    }
    
    // Probar una consulta simple sin include
    console.log('\n🧪 Probando consulta simple...');
    try {
      const projects = await db.proyectos.findAll({
        limit: 3
      });
      console.log(`✅ Consulta simple exitosa. Encontrados ${projects.length} proyectos`);
    } catch (error) {
      console.error('❌ Error en consulta simple:', error.message);
    }
    
    // Probar consulta con include manual
    console.log('\n🧪 Probando consulta con include manual...');
    try {
      const projects = await db.proyectos.findAll({
        include: [{
          model: db.users,
          as: 'user',
          attributes: ['username', 'nombre']
        }],
        limit: 3
      });
      console.log(`✅ Consulta con include exitosa. Encontrados ${projects.length} proyectos`);
    } catch (error) {
      console.error('❌ Error en consulta con include:', error.message);
      console.error('Stack:', error.stack);
    }
    
    console.log('\n✅ Debug completado');
    
  } catch (error) {
    console.error('❌ Error en debug:', error);
  } finally {
    process.exit(0);
  }
}

debugAssociations(); 