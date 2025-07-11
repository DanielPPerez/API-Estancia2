// debug-calificaciones.js
const db = require('./app/models');

async function debugCalificaciones() {
  try {
    console.log('🔍 Verificando modelos disponibles...');
    console.log('Modelos:', Object.keys(db).filter(key => 
      key !== 'sequelize' && key !== 'Sequelize'
    ));

    console.log('\n🔍 Verificando asociaciones de calificaciones...');
    if (db.calificaciones && db.calificaciones.associations) {
      console.log('Asociaciones de calificaciones:', Object.keys(db.calificaciones.associations));
    }

    console.log('\n🔍 Verificando asociaciones de user...');
    if (db.user && db.user.associations) {
      console.log('Asociaciones de user:', Object.keys(db.user.associations));
    }

    console.log('\n🔍 Verificando asociaciones de proyectos...');
    if (db.proyectos && db.proyectos.associations) {
      console.log('Asociaciones de proyectos:', Object.keys(db.proyectos.associations));
    }

    console.log('\n🧪 Probando consulta de calificaciones...');
    const calificaciones = await db.calificaciones.findAll({
      include: [
        {
          model: db.proyectos,
          as: 'proyecto',
          attributes: ['name']
        },
        {
          model: db.user,
          as: 'evaluador',
          attributes: ['username']
        },
        {
          model: db.user,
          as: 'alumno',
          attributes: ['username']
        }
      ],
      limit: 5
    });

    console.log('✅ Consulta exitosa. Calificaciones encontradas:', calificaciones.length);
    
    if (calificaciones.length > 0) {
      console.log('Primera calificación:', JSON.stringify(calificaciones[0], null, 2));
    }

  } catch (error) {
    console.error('❌ Error en debug:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    process.exit(0);
  }
}

debugCalificaciones(); 