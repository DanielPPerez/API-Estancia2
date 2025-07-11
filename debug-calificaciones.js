const db = require('./app/models');

async function debugCalificaciones() {
  try {
    console.log('🔍 Debuggeando modelo de calificaciones...');
    
    // Verificar que los modelos estén disponibles
    console.log('\n📋 Modelos disponibles:');
    const modelNames = Object.keys(db).filter(key => 
      key !== 'sequelize' && key !== 'Sequelize'
    );
    console.log(modelNames);
    
    // Verificar asociaciones de calificaciones
    if (db.calificaciones) {
      console.log('\n🔍 Asociaciones de calificaciones:');
      console.log('db.calificaciones.associations:', !!db.calificaciones.associations);
      if (db.calificaciones.associations) {
        console.log('Asociaciones:', Object.keys(db.calificaciones.associations));
        console.log('Asociación proyecto:', !!db.calificaciones.associations.proyecto);
        console.log('Asociación evaluador:', !!db.calificaciones.associations.evaluador);
        console.log('Asociación alumno:', !!db.calificaciones.associations.alumno);
      }
    }
    
    // Verificar asociaciones de proyectos
    if (db.proyectos) {
      console.log('\n🔍 Asociaciones de proyectos:');
      if (db.proyectos.associations) {
        console.log('Asociaciones:', Object.keys(db.proyectos.associations));
      }
    }
    
    // Verificar asociaciones de usuarios
    if (db.users) {
      console.log('\n🔍 Asociaciones de usuarios:');
      if (db.users.associations) {
        console.log('Asociaciones:', Object.keys(db.users.associations));
      }
    }
    
    // Probar una consulta simple sin include
    console.log('\n🧪 Probando consulta simple de calificaciones...');
    try {
      const calificaciones = await db.calificaciones.findAll({
        limit: 3
      });
      console.log(`✅ Consulta simple exitosa. Encontradas ${calificaciones.length} calificaciones`);
    } catch (error) {
      console.error('❌ Error en consulta simple:', error.message);
    }
    
    // Probar consulta con include
    console.log('\n🧪 Probando consulta con include...');
    try {
      const calificaciones = await db.calificaciones.findAll({
        include: [
          {
            model: db.proyectos,
            as: 'proyecto',
            attributes: ['name']
          },
          {
            model: db.users,
            as: 'evaluador',
            attributes: ['username']
          },
          {
            model: db.users,
            as: 'alumno',
            attributes: ['username']
          }
        ],
        limit: 3
      });
      console.log(`✅ Consulta con include exitosa. Encontradas ${calificaciones.length} calificaciones`);
    } catch (error) {
      console.error('❌ Error en consulta con include:', error.message);
      console.error('Stack:', error.stack);
    }
    
    console.log('\n✅ Debug completado');
    
  } catch (error) {
    console.error('❌ Error durante el debug:', error);
    console.error('Stack trace:', error.stack);
  } finally {
    process.exit(0);
  }
}

debugCalificaciones(); 