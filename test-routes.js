// test-routes.js - Script para probar todas las rutas
const db = require('./app/models');
const { setupDatabase } = require('./app/config/initialSetup');

async function testRoutes() {
  try {
    console.log('🧪 Probando todas las rutas...');
    
    // Verificar conexión
    await db.sequelize.authenticate();
    console.log('✅ Conexión exitosa');
    
    // Sincronizar modelos
    await db.sequelize.sync({ force: false });
    console.log('✅ Modelos sincronizados');
    
    // Ejecutar configuración inicial
    console.log('🔄 Ejecutando configuración inicial...');
    await setupDatabase();
    console.log('✅ Configuración inicial completada');
    
    // Verificar que los modelos estén disponibles
    const User = db.users || db.user;
    const Role = db.roles || db.role;
    const Proyecto = db.projects || db.proyecto;
    const Calificaciones = db.calificaciones;
    
    console.log('\n📋 Verificando modelos:');
    console.log('- User:', !!User);
    console.log('- Role:', !!Role);
    console.log('- Proyecto:', !!Proyecto);
    console.log('- Calificaciones:', !!Calificaciones);
    
    // Probar consultas básicas
    console.log('\n🧪 Probando consultas básicas...');
    
    // Probar obtener todos los roles
    try {
      const roles = await Role.findAll();
      console.log('✅ Roles encontrados:', roles.length);
    } catch (error) {
      console.error('❌ Error obteniendo roles:', error.message);
    }
    
    // Probar obtener todos los usuarios
    try {
      const users = await User.findAll({
        include: [{
          model: Role,
          through: db.user_roles,
          attributes: ['name']
        }]
      });
      console.log('✅ Usuarios encontrados:', users.length);
    } catch (error) {
      console.error('❌ Error obteniendo usuarios:', error.message);
    }
    
    // Probar obtener todos los proyectos
    try {
      const projects = await Proyecto.findAll();
      console.log('✅ Proyectos encontrados:', projects.length);
    } catch (error) {
      console.error('❌ Error obteniendo proyectos:', error.message);
    }
    
    // Probar obtener todas las calificaciones
    try {
      const calificaciones = await Calificaciones.findAll();
      console.log('✅ Calificaciones encontradas:', calificaciones.length);
    } catch (error) {
      console.error('❌ Error obteniendo calificaciones:', error.message);
    }
    
    console.log('\n🎉 Prueba de rutas completada');
    
  } catch (error) {
    console.error('❌ Error en prueba de rutas:', error);
  } finally {
    process.exit(0);
  }
}

testRoutes(); 