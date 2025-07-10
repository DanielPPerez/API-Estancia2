// test-auth.js - Script para probar la autenticación y roles
const db = require('./app/models');
const bcrypt = require('bcryptjs');

async function testAuth() {
  try {
    console.log('🔍 Probando autenticación y roles...');
    
    // 1. Verificar conexión
    await db.sequelize.authenticate();
    console.log('✅ Conexión a la base de datos exitosa');
    
    // 2. Sincronizar modelos
    await db.sequelize.sync({ force: false });
    console.log('✅ Modelos sincronizados');
    
    // 3. Crear roles si no existen (sin prefijo ROLE_)
    const roles = ['user', 'admin', 'evaluador', 'moderator'];
    for (const roleName of roles) {
      await db.role.findOrCreate({
        where: { name: roleName },
        defaults: { name: roleName }
      });
    }
    console.log('✅ Roles creados/verificados:', roles);
    
    // 4. Crear usuario admin si no existe
    const adminUser = await db.user.findOne({ where: { username: 'admin' } });
    if (!adminUser) {
      console.log('🔧 Creando usuario admin...');
      
      const hashedPassword = bcrypt.hashSync('admin123', 8);
      const newUser = await db.user.create({
        username: 'admin',
        email: 'admin@test.com',
        password: hashedPassword,
        nombre: 'Administrador',
        carrera: 'Sistemas',
        cuatrimestre: '8',
        categoria: 'Emprendimiento'
      });
      
      // Asignar rol de admin
      const adminRole = await db.role.findOne({ where: { name: 'admin' } });
      await newUser.setRoles([adminRole]);
      
      console.log('✅ Usuario admin creado con éxito');
    } else {
      console.log('✅ Usuario admin ya existe');
    }
    
    // 5. Verificar roles del usuario admin
    const adminWithRoles = await db.user.findOne({
      where: { username: 'admin' },
      include: [{
        model: db.role,
        through: db.user_roles,
        attributes: ['name']
      }]
    });
    
    console.log('👤 Usuario admin roles:', adminWithRoles.roles.map(r => r.name));
    
    // 6. Probar middleware de roles
    const { authJwt } = require('./app/middleware/authJwt');
    
    // Simular request para probar middleware
    const mockReq = { userId: adminWithRoles.id };
    const mockRes = {
      status: (code) => ({
        send: (data) => {
          console.log(`Response ${code}:`, data);
          return mockRes;
        }
      })
    };
    
    console.log('🔍 Probando middleware isAdmin...');
    await authJwt.isAdmin(mockReq, mockRes, () => {
      console.log('✅ Middleware isAdmin pasó correctamente');
    });
    
    console.log('🎉 Prueba de autenticación completada exitosamente');
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error);
  } finally {
    process.exit(0);
  }
}

testAuth(); 