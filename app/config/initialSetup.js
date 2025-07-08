const pool = require('./db.config');
const bcrypt = require('bcryptjs');

// --- DATOS DE CONFIGURACIÓN ---
const ROLES = ['user', 'moderator', 'admin'];

const USERS = [
  // Administradora
  {
    email: 'cmadariaga@upchiapas.edu.mx',
    username: 'cmadariaga',
    nombre: 'Claudia Madariaga',
    password: process.env.ADMIN_DEFAULT_PASSWORD || 'ChangeMeAdmin123!', // Usa variable de entorno
    roles: ['admin', 'moderator', 'user']
  },
  // Evaluadores (ahora serán 'moderator')
  {
    email: 'paniawoah@gmail.com',
    username: 'd.paniagua',
    nombre: 'Daniel Paniagua',
    password: process.env.EVALUADOR_DEFAULT_PASSWORD || 'ChangeMeEvaluador123!',
    roles: ['moderator', 'user']
  },
  {
    email: 'roberto.borges@seyt.gob.mx',
    username: 'r.borges',
    nombre: 'Roberto Borges',
    password: process.env.EVALUADOR_DEFAULT_PASSWORD || 'ChangeMeEvaluador123!',
    roles: ['moderator', 'user']
  },
  {
    email: 'capacitaeconomia@gmail.com',
    username: 'm.camacho',
    nombre: 'Mauricio Camacho',
    password: process.env.EVALUADOR_DEFAULT_PASSWORD || 'ChangeMeEvaluador123!',
    roles: ['moderator', 'user']
  },
  {
    email: 'dpedrero@hotmail.com',
    username: 'd.pedrero',
    nombre: 'Damian Pedrero',
    password: process.env.EVALUADOR_DEFAULT_PASSWORD || 'ChangeMeEvaluador123!',
    roles: ['moderator', 'user']
  }
];

// --- FUNCIONES DE LÓGICA ---
async function createRoles() {
  console.log("Checking and creating roles...");
  try {
    for (const roleName of ROLES) {
      const [rows] = await pool.query("SELECT id FROM roles WHERE name = ?", [roleName]);
      if (rows.length === 0) {
        await pool.query("INSERT INTO roles (name) VALUES (?)", [roleName]);
        console.log(` -> Role '${roleName}' created.`);
      }
    }
    console.log("Roles are up to date.");
  } catch (error) {
    console.error("Error creating roles:", error);
    // Propagamos el error para que el proceso de inicio se detenga si algo sale mal con los roles
    throw error; 
  }
}

async function createUsersAndAssignRoles() {
  console.log("Checking and creating initial users...");
  try {
    const [roles] = await pool.query("SELECT id, name FROM roles");
    const roleMap = new Map(roles.map(role => [role.name, role.id]));

    for (const userData of USERS) {
      const [userRows] = await pool.query("SELECT id FROM users WHERE email = ?", [userData.email]);
      let userId;

      if (userRows.length === 0) {
        const hashedPassword = bcrypt.hashSync(userData.password, 8);
        const [result] = await pool.query(
          "INSERT INTO users (username, email, password, nombre) VALUES (?, ?, ?, ?)",
          [userData.username, userData.email, hashedPassword, userData.nombre]
        );
        userId = result.insertId;
        console.log(` -> User '${userData.email}' created with ID: ${userId}.`);
      } else {
        userId = userRows[0].id;
      }

      for (const roleName of userData.roles) {
        const roleId = roleMap.get(roleName);
        if (roleId) {
          const [userRoleRows] = await pool.query(
            "SELECT * FROM user_roles WHERE user_id = ? AND role_id = ?",
            [userId, roleId]
          );
          if (userRoleRows.length === 0) {
            await pool.query(
              "INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)",
              [userId, roleId]
            );
            console.log(`    - Role '${roleName}' assigned to user '${userData.email}'.`);
          }
        }
      }
    }
    console.log("Initial users are up to date.");
  } catch (error) {
    console.error("Error creating users and assigning roles:", error);
    throw error;
  }
}

// --- FUNCIÓN PRINCIPAL EXPORTADA ---
exports.initialSetup = async () => {
  try {
    console.log("--- Starting Initial Server Setup ---");
    await createRoles();
    await createUsersAndAssignRoles();
    console.log("--- Initial Setup Complete ---");
  } catch(error) {
    console.error("!!! CRITICAL: Initial setup failed. Server might not work as expected. !!!");
    console.error(error);
  }
};