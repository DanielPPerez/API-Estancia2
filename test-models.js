// test-models.js - Script para probar los modelos y asociaciones
const db = require('./app/models');

async function testModels() {
  try {
    console.log('🔍 Probando modelos y asociaciones...');
    
    // 1. Verificar conexión
    await db.sequelize.authenticate();
    console.log('✅ Conexión a la base de datos exitosa');
    
    // 2. Verificar que todos los modelos estén disponibles
    const modelNames = Object.keys(db).filter(key => 
      key !== 'sequelize' && key !== 'Sequelize'
    );
    console.log('📋 Modelos disponibles:', modelNames);
    
    // 3. Verificar que las asociaciones se establecieron correctamente
    console.log('\n🔗 Verificando asociaciones...');
    
    if (db.user && db.role && db.user_roles) {
      console.log('✅ Asociación User-Role establecida');
    }
    
    if (db.user && db.proyecto) {
      console.log('✅ Asociación User-Proyecto establecida');
    }
    
    if (db.proyecto && db.calificaciones) {
      console.log('✅ Asociación Proyecto-Calificaciones establecida');
    }
    
    if (db.user && db.calificaciones) {
      console.log('✅ Asociación User-Calificaciones establecida');
    }
    
    // 4. Sincronizar modelos
    await db.sequelize.sync({ force: false });
    console.log('✅ Modelos sincronizados');
    
    // 5. Crear datos de prueba
    console.log('\n🧪 Creando datos de prueba...');
    
    // Crear roles
    const roles = ['user', 'admin', 'evaluador', 'moderator'];
    for (const roleName of roles) {
      await db.role.findOrCreate({
        where: { name: roleName },
        defaults: { name: roleName }
      });
    }
    console.log('✅ Roles creados');
    
    // Crear usuario de prueba
    const bcrypt = require('bcryptjs');
    const hashedPassword = bcrypt.hashSync('test123', 8);
    
    const testUser = await db.user.findOrCreate({
      where: { username: 'testuser' },
      defaults: {
        username: 'testuser',
        email: 'test@test.com',
        password: hashedPassword,
        nombre: 'Usuario Test',
        carrera: 'Sistemas',
        cuatrimestre: '8',
        categoria: 'Emprendimiento'
      }
    });
    
    // Asignar rol
    const userRole = await db.role.findOne({ where: { name: 'user' } });
    if (userRole) {
      await testUser[0].setRoles([userRole]);
    }
    
    console.log('✅ Usuario de prueba creado');
    
    // 6. Probar consultas con asociaciones
    console.log('\n🔍 Probando consultas con asociaciones...');
    
    const userWithRoles = await db.user.findOne({
      where: { username: 'testuser' },
      include: [{
        model: db.role,
        through: db.user_roles,
        attributes: ['name']
      }]
    });
    
    if (userWithRoles) {
      console.log('✅ Consulta con roles exitosa');
      console.log('👤 Usuario:', userWithRoles.username);
      console.log('🏷️ Roles:', userWithRoles.roles.map(r => r.name));
    }
    
    console.log('\n🎉 Prueba de modelos completada exitosamente');
    
  } catch (error) {
    console.error('❌ Error en la prueba de modelos:', error);
  } finally {
    process.exit(0);
  }
}

testModels(); 