// Importamos los modelos de Sequelize, no la configuración
const db = require("../models"); 
const bcrypt = require('bcryptjs');

// Los modelos están disponibles en el objeto 'db'
const Role = db.role;
const User = db.user;

// --- DATOS DE CONFIGURACIÓN (sin cambios) ---
const ROLES = ['user', 'moderator', 'admin', 'evaluador'];

const USERS = [
  // Administradora
  {
    email: 'cmadariaga@upchiapas.edu.mx',
    username: 'Claudia Madariaga',
    nombre: 'Claudia Madariaga',
    password: 'Claudia2025!',
    roles: ['admin', 'moderator', 'user', 'evaluador']
  },
  // Evaluadores
  {
    email: 'paniawoah@gmail.com',
    username: 'Daniel Paniagua',
    nombre: 'Daniel Paniagua',
    password: 'Daniel2025!',
    roles: ['evaluador', 'user']
  },
  {
    email: 'roberto.borges@seyt.gob.mx',
    username: 'Roberto Borges',
    nombre: 'Roberto Borges',
    password: 'Roberto2025!',
    roles: ['evaluador', 'user']
  },
  {
    email: 'capacitaeconomia@gmail.com',
    username: 'Mauricio Camacho',
    nombre: 'Mauricio Camacho',
    password: 'Mauricio2025!',
    roles: ['evaluador', 'user']
  },
  {
    email: 'dpedrero@hotmail.com',
    username: 'Damian Pedrero',
    nombre: 'Damian Pedrero',
    password: 'Damian2025!',
    roles: ['evaluador', 'user']
  }
];

// --- FUNCIONES DE LÓGICA (Reescritas con Sequelize) ---

async function syncDatabase() {
  console.log("Synchronizing database with Sequelize...");
  try {
    // Force: false - no elimina las tablas existentes
    // Alter: true - modifica las tablas existentes si es necesario
    await db.sequelize.sync({ force: false, alter: true });
    console.log("Database synchronized successfully.");
  } catch (error) {
    console.error("Error synchronizing database:", error);
    throw error;
  }
}

async function createRoles() {
  console.log("Checking and creating roles using Sequelize...");
  try {
    for (const roleName of ROLES) {
      // Usamos Role.findOrCreate. Es el método perfecto para esto.
      // Busca un rol por nombre, si no lo encuentra, lo crea.
      const [role, created] = await Role.findOrCreate({
        where: { name: roleName }
      });
      if (created) {
        console.log(` -> Role '${roleName}' created.`);
      }
    }
    console.log("Roles are up to date.");
  } catch (error) {
    console.error("Error creating roles with Sequelize:", error);
    throw error;
  }
}

async function createUsers() {
  console.log("Checking and creating initial users using Sequelize...");
  try {
    for (const userData of USERS) {
      // 1. Buscamos o creamos el usuario
      const [user, created] = await User.findOrCreate({
        where: { email: userData.email },
        // 'defaults' se usa solo si el usuario necesita ser creado
        defaults: {
          username: userData.username,
          nombre: userData.nombre,
          password: bcrypt.hashSync(userData.password, 8)
        }
      });

      // 2. Si el usuario fue creado, le asignamos sus roles
      if (created) {
        console.log(` -> User '${userData.email}' created.`);
        
        // Buscamos los objetos de Role que corresponden a los nombres de los roles
        const rolesInDb = await Role.findAll({
          where: {
            name: userData.roles // Sequelize entiende este array y busca todos los roles
          }
        });

        // Usamos el método mágico 'setRoles' que Sequelize crea para la asociación
        await user.setRoles(rolesInDb);
        console.log(`    - Roles assigned for '${userData.email}'.`);
      }
    }
    console.log("Initial users are up to date.");
  } catch (error) {
    console.error("Error creating users with Sequelize:", error);
    throw error;
  }
}

// --- FUNCIÓN PRINCIPAL EXPORTADA (sin cambios en la lógica de llamada) ---
exports.initialSetup = async () => {
  try {
    console.log("--- Starting Initial Server Setup ---");
    await syncDatabase();
    await createRoles();
    await createUsers();
    console.log("--- Initial Setup Complete ---");
  } catch(error) {
    console.error("!!! CRITICAL: Initial setup failed. Server might not work as expected. !!!");
    // No es necesario imprimir el error dos veces, ya se imprime en la función que falla.
  }
};