// test-associations.js - Script para verificar asociaciones
const db = require('./app/models');

async function testAssociations() {
  try {
    console.log('🔍 Probando asociaciones entre modelos...');
    
    // Verificar que los modelos estén disponibles
    console.log('\n📋 Modelos disponibles:');
    const modelNames = Object.keys(db).filter(key => 
      key !== 'sequelize' && key !== 'Sequelize'
    );
    console.log(modelNames);
    
    // Verificar asociaciones de proyectos
    if (db.proyectos) {
      console.log('\n🔍 Asociaciones de proyectos:');
      if (db.proyectos.associations) {
        console.log('Asociaciones:', Object.keys(db.proyectos.associations));
      }
      
      // Probar consulta con include
      console.log('\n🧪 Probando consulta con include...');
      try {
        const projects = await db.proyectos.findAll({
          include: [{
            model: db.users,
            as: 'user',
            attributes: ['username', 'nombre']
          }],
          limit: 3
        });
        
        console.log(`✅ Consulta exitosa. Encontrados ${projects.length} proyectos`);
        
        if (projects.length > 0) {
          console.log('Primer proyecto con usuario:', {
            id: projects[0].id,
            name: projects[0].name,
            user: projects[0].user ? {
              username: projects[0].user.username,
              nombre: projects[0].user.nombre
            } : 'Sin usuario'
          });
        }
      } catch (error) {
        console.error('❌ Error en consulta con include:', error.message);
      }
    }
    
    // Verificar asociaciones de usuarios
    if (db.users) {
      console.log('\n🔍 Asociaciones de usuarios:');
      if (db.users.associations) {
        console.log('Asociaciones:', Object.keys(db.users.associations));
      }
    }
    
    console.log('\n✅ Prueba de asociaciones completada');
    
  } catch (error) {
    console.error('❌ Error en prueba de asociaciones:', error);
  } finally {
    process.exit(0);
  }
}

testAssociations(); 