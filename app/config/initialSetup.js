// app/config/initialSetup.js
const db = require("../models");
const bcrypt = require("bcryptjs");

// Definir los usuarios que deben existir en el sistema
const USERS = [
  // Administradora
  {
    id: 1,
    email: 'cmadariaga@upchiapas.edu.mx',
    username: 'Claudia Madariaga',
    nombre: 'Claudia Madariaga',
    password: 'Claudia2025!',
    roles: ['admin', 'moderator', 'user', 'evaluador']
  },
  // Evaluadores
  {
    id: 2,
    email: 'paniawoah@gmail.com',
    username: 'Daniel Paniagua',
    nombre: 'Daniel Paniagua',
    password: 'Daniel2025!',
    roles: ['evaluador', 'user']
  },
  {
    id: 3,
    email: 'roberto.borges@seyt.gob.mx',
    username: 'Roberto Borges',
    nombre: 'Roberto Borges',
    password: 'Roberto2025!',
    roles: ['evaluador', 'user']
  },
  {
    id: 4,
    email: 'capacitaeconomia@gmail.com',
    username: 'Mauricio Camacho',
    nombre: 'Mauricio Camacho',
    password: 'Mauricio2025!',
    roles: ['evaluador', 'user']
  },
  {
    id: 5,
    email: 'dpedrero@hotmail.com',
    username: 'Damian Pedrero',
    nombre: 'Damian Pedrero',
    password: 'Damian2025!',
    roles: ['evaluador', 'user']
  }
];

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

    // 3. Crear usuarios específicos del sistema
    console.log("🔧 Verificando y creando usuarios del sistema...");
    
    for (const userData of USERS) {
      try {
        // Verificar si el usuario ya existe
        const existingUser = await User.findOne({
          where: { 
            $or: [
              { email: userData.email },
              { username: userData.username }
            ]
          }
        });

        if (!existingUser) {
          console.log(`📝 Creando usuario: ${userData.nombre} (${userData.email})`);
          
          const hashedPassword = bcrypt.hashSync(userData.password, 8);
          
          const newUser = await User.create({
            id: userData.id,
            username: userData.username,
            email: userData.email,
            password: hashedPassword,
            nombre: userData.nombre,
            carrera: 'Sistemas',
            cuatrimestre: '8',
            categoria: 'Emprendimiento'
          });

          // Asignar roles al usuario
          for (const roleName of userData.roles) {
            const role = await Role.findOne({
              where: { name: roleName }
            });

            if (role) {
              await newUser.addRole(role);
              console.log(`  ✅ Rol '${roleName}' asignado a ${userData.nombre}`);
            } else {
              console.error(`  ❌ Error: No se encontró el rol '${roleName}'`);
            }
          }

          console.log(`✅ Usuario ${userData.nombre} creado exitosamente`);
        } else {
          console.log(`✅ Usuario ${userData.nombre} ya existe`);
          
          // Verificar y actualizar roles si es necesario
          const userRoles = await existingUser.getRoles();
          const currentRoleNames = userRoles.map(role => role.name);
          
          for (const roleName of userData.roles) {
            if (!currentRoleNames.includes(roleName)) {
              const role = await Role.findOne({
                where: { name: roleName }
              });
              
              if (role) {
                await existingUser.addRole(role);
                console.log(`  ✅ Rol '${roleName}' agregado a ${userData.nombre}`);
              }
            }
          }
        }
      } catch (error) {
        console.error(`❌ Error al crear/verificar usuario ${userData.nombre}:`, error);
      }
    }

    console.log("🎉 Configuración de base de datos completada exitosamente");
    
    // Mostrar información de usuarios creados
    const allUsers = await User.findAll({
      include: [{
        model: Role,
        through: UserRoles,
        attributes: ['name']
      }],
      order: [['id', 'ASC']]
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