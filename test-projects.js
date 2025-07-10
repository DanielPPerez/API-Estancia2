const db = require('./app/models');

async function testProjects() {
  try {
    console.log('🔍 Verificando modelos disponibles...');
    console.log('Modelos en db:', Object.keys(db).filter(key => 
      key !== 'sequelize' && key !== 'Sequelize'
    ));

    console.log('\n🔍 Verificando modelo de proyectos...');
    console.log('db.proyectos:', !!db.proyectos);
    console.log('db.proyecto:', !!db.proyecto);
    console.log('db.projects:', !!db.projects);

    if (db.proyectos) {
      console.log('\n✅ Modelo proyectos encontrado');
      console.log('Nombre del modelo:', db.proyectos.name);
      console.log('Nombre de la tabla:', db.proyectos.tableName);
      
      // Probar una consulta simple
      console.log('\n🔍 Probando consulta findAll...');
      const projects = await db.proyectos.findAll({
        limit: 5,
        include: [{
          model: db.users,
          as: 'user',
          attributes: ['username', 'nombre']
        }]
      });
      
      console.log(`✅ Consulta exitosa. Encontrados ${projects.length} proyectos`);
      
      if (projects.length > 0) {
        console.log('Primer proyecto:', {
          id: projects[0].id,
          name: projects[0].name,
          user: projects[0].user ? projects[0].user.username : 'Sin usuario'
        });
      }
    } else {
      console.log('❌ Modelo proyectos no encontrado');
    }

    console.log('\n🔍 Verificando modelo de usuarios...');
    console.log('db.users:', !!db.users);
    console.log('db.user:', !!db.user);

    if (db.users) {
      console.log('✅ Modelo usuarios encontrado');
      console.log('Nombre del modelo:', db.users.name);
    }

    console.log('\n🔍 Verificando asociaciones...');
    if (db.proyectos && db.proyectos.associations) {
      console.log('Asociaciones de proyectos:', Object.keys(db.proyectos.associations));
    }

    if (db.users && db.users.associations) {
      console.log('Asociaciones de usuarios:', Object.keys(db.users.associations));
    }

  } catch (error) {
    console.error('❌ Error en la prueba:', error);
  } finally {
    process.exit(0);
  }
}

testProjects(); 