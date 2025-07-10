// app/config/initialSetup.js
const db = require("../models");
const bcrypt = require("bcryptjs");

const setupDatabase = async () => {
  try {
    console.log("🔄 Iniciando configuración de la base de datos...");

    // Verificar que los modelos necesarios estén disponibles
    // El modelo role se carga como 'roles' (plural)
    const Role = db.roles || db.role;
    const User = db.users || db.user;
    const UserRoles = db.user_roles;

    if (!Role) {
      throw new Error("Modelo 'role/roles' no está disponible");
    }
    if (!User) {
      throw new Error("Modelo 'user/users' no está disponible");
    }
    if (!UserRoles) {
      throw new Error("Modelo 'user_roles' no está disponible");
    }

    console.log("✅ Modelos verificados");

    // 1. Sincronizar todos los modelos
    await db.sequelize.sync({ force: false });
    console.log("✅ Modelos sincronizados");

    // 2. Crear roles básicos si no existen
    const roles = [
      { name: 'user', description: 'Usuario regular' },
      { name: 'admin', description: 'Administrador del sistema' },
      { name: 'evaluador', description: 'Evaluador de proyectos' },
      { name: 'moderator', description: 'Moderador del sistema' }
    ];

    for (const roleData of roles) {
      try {
        await Role.findOrCreate({
          where: { name: roleData.name },
          defaults: roleData
        });
        console.log(`✅ Rol '${roleData.name}' creado/verificado`);
      } catch (error) {
        console.error(`❌ Error al crear rol '${roleData.name}':`, error);
      }
    }
    console.log("✅ Roles creados/verificados");

    // 3. Crear usuario administrador por defecto si no existe
    const adminUser = await User.findOne({
      where: { username: 'admin' }
    });

    if (!adminUser) {
      console.log("🔧 Creando usuario administrador por defecto...");
      
      const hashedPassword = bcrypt.hashSync('admin123', 8);
      
      const newAdmin = await User.create({
        username: 'admin',
        email: 'admin@upchiapas.edu.mx',
        password: hashedPassword,
        nombre: 'Administrador',
        carrera: 'Sistemas',
        cuatrimestre: '8',
        categoria: 'Emprendimiento'
      });

      // Asignar rol de administrador
      const adminRole = await Role.findOne({
        where: { name: 'admin' }
      });

      if (adminRole) {
        // Usar addRole en lugar de setRoles
        await newAdmin.addRole(adminRole);
        console.log("✅ Usuario administrador creado con rol 'admin'");
      } else {
        console.error("❌ Error: No se encontró el rol 'admin'");
      }
    } else {
      console.log("✅ Usuario administrador ya existe");
    }

    // 4. Crear usuario evaluador por defecto si no existe
    const evaluadorUser = await User.findOne({
      where: { username: 'evaluador' }
    });

    if (!evaluadorUser) {
      console.log("🔧 Creando usuario evaluador por defecto...");
      
      const hashedPassword = bcrypt.hashSync('evaluador123', 8);
      
      const newEvaluador = await User.create({
        username: 'evaluador',
        email: 'evaluador@upchiapas.edu.mx',
        password: hashedPassword,
        nombre: 'Evaluador',
        carrera: 'Sistemas',
        cuatrimestre: '8',
        categoria: 'Emprendimiento'
      });

      // Asignar rol de evaluador
      const evaluadorRole = await Role.findOne({
        where: { name: 'evaluador' }
      });

      if (evaluadorRole) {
        // Usar addRole en lugar de setRoles
        await newEvaluador.addRole(evaluadorRole);
        console.log("✅ Usuario evaluador creado con rol 'evaluador'");
      } else {
        console.error("❌ Error: No se encontró el rol 'evaluador'");
      }
    } else {
      console.log("✅ Usuario evaluador ya existe");
    }

    console.log("🎉 Configuración de base de datos completada exitosamente");
    
    // Mostrar información de usuarios creados
    const allUsers = await User.findAll({
      include: [{
        model: Role,
        through: UserRoles,
        attributes: ['name']
      }]
    });

    console.log("\n📋 Usuarios en el sistema:");
    allUsers.forEach(user => {
      const roles = user.roles.map(role => role.name).join(', ');
      console.log(`- ${user.username} (${user.email}) - Roles: ${roles}`);
    });

  } catch (error) {
    console.error("❌ Error durante la configuración:", error);
    throw error;
  }
};

module.exports = { setupDatabase };