// test-associations.js - Script para verificar asociaciones
const db = require('./app/models');

async function testAssociations() {
  try {
    console.log('🔍 Verificando asociaciones...');
    
    // Verificar conexión
    await db.sequelize.authenticate();
    console.log('✅ Conexión exitosa');
    
    // Obtener referencias a los modelos
    const User = db.users || db.user;
    const Role = db.roles || db.role;
    const UserRoles = db.user_roles;
    
    console.log('📋 Modelos disponibles:');
    console.log('- User:', !!User);
    console.log('- Role:', !!Role);
    console.log('- UserRoles:', !!UserRoles);
    
    // Verificar métodos de asociación
    if (User) {
      console.log('\n🔗 Métodos de User:');
      console.log('- addRole:', typeof User.prototype.addRole);
      console.log('- setRoles:', typeof User.prototype.setRoles);
      console.log('- getRoles:', typeof User.prototype.getRoles);
      console.log('- hasRole:', typeof User.prototype.hasRole);
    }
    
    if (Role) {
      console.log('\n🔗 Métodos de Role:');
      console.log('- addUser:', typeof Role.prototype.addUser);
      console.log('- setUsers:', typeof Role.prototype.setUsers);
      console.log('- getUsers:', typeof Role.prototype.getUsers);
      console.log('- hasUser:', typeof Role.prototype.hasUser);
    }
    
    // Verificar asociaciones establecidas
    console.log('\n🔗 Verificando asociaciones establecidas:');
    
    if (User && User.associations) {
      console.log('User associations:', Object.keys(User.associations));
    }
    
    if (Role && Role.associations) {
      console.log('Role associations:', Object.keys(Role.associations));
    }
    
    // Probar creación de un usuario de prueba
    console.log('\n🧪 Probando creación de usuario con roles...');
    
    try {
      // Crear un rol de prueba
      const testRole = await Role.findOrCreate({
        where: { name: 'test_role' },
        defaults: { name: 'test_role', description: 'Rol de prueba' }
      });
      
      // Crear un usuario de prueba
      const testUser = await User.create({
        username: 'test_user_' + Date.now(),
        email: 'test@example.com',
        password: 'password123',
        nombre: 'Usuario Prueba',
        carrera: 'Sistemas',
        cuatrimestre: '8',
        categoria: 'Emprendimiento'
      });
      
      // Asignar rol al usuario
      await testUser.addRole(testRole[0]);
      console.log('✅ Usuario creado y rol asignado exitosamente');
      
      // Verificar que el rol se asignó correctamente
      const userWithRoles = await User.findOne({
        where: { id: testUser.id },
        include: [{
          model: Role,
          through: UserRoles,
          attributes: ['name']
        }]
      });
      
      console.log('✅ Usuario con roles:', userWithRoles.roles.map(r => r.name));
      
      // Limpiar datos de prueba
      await testUser.destroy();
      await testRole[0].destroy();
      console.log('✅ Datos de prueba eliminados');
      
    } catch (error) {
      console.error('❌ Error en prueba de asociaciones:', error);
    }
    
    console.log('\n🎉 Verificación de asociaciones completada');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

testAssociations(); 