// controllers/user.controller.js
const pool = require('../config/db.pool');
const bcrypt = require('bcryptjs');

// Crear un nuevo usuario (función básica, signup sería más compleja con roles)
// Esta función es un CREATE básico. La función `signup` de tu `auth.controller.js`
// es más completa porque también asigna roles. Deberías adaptar `signup` para usar SQL directo
// y quizás llamar a una función como esta internamente o replicar su lógica de inserción.
exports.createUser = async (req, res) => {
  const { username, email, password, nombre, carrera, cuatrimestre, categoria } = req.body;

  if (!username || !email || !password) {
    return res.status(400).send({ message: "Username, email, and password are required." });
  }

  try {
    const hashedPassword = bcrypt.hashSync(password, 8);
    const [result] = await pool.query(
      "INSERT INTO users (username, email, password, nombre, carrera, cuatrimestre, categoria, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())",
      [username, email, hashedPassword, nombre, carrera, cuatrimestre, categoria]
    );
    res.status(201).send({ id: result.insertId, username, email, message: "User created successfully." });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      let field = error.message.includes("'users.username'") ? 'username' : 'email';
      return res.status(409).send({ message: `Error: ${field} already exists.` });
    }
    console.error("Error creating user:", error);
    res.status(500).send({ message: error.message || "Some error occurred while creating the User." });
  }
};

// Obtener todos los usuarios 
exports.getAllUsers = async (req, res) => {
  try {
    const [users] = await pool.query(
      "SELECT id, username, email, nombre, carrera, cuatrimestre, categoria, created_at FROM users"
    );
    res.status(200).send(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).send({ message: error.message || "Some error occurred while retrieving users." });
  }
};

// Obtener un usuario por ID
exports.getUserById = async (req, res) => {
  const { id } = req.params;
  try {
    const [users] = await pool.query(
      "SELECT id, username, email, nombre, carrera, cuatrimestre, categoria, created_at FROM users WHERE id = ?",
      [id]
    );
    if (users.length === 0) {
      return res.status(404).send({ message: `User with id ${id} not found.` });
    }
    // También podrías querer obtener los roles del usuario aquí
    const [roles] = await pool.query(
        `SELECT r.id, r.name 
         FROM roles r
         JOIN user_roles ur ON r.id = ur.role_id
         WHERE ur.user_id = ?`,
        [id]
    );
    users[0].roles = roles;
    res.status(200).send(users[0]);
  } catch (error) {
    console.error(`Error fetching user with id ${id}:`, error);
    res.status(500).send({ message: error.message || "Error retrieving User with id " + id });
  }
};

// Actualizar un usuario por ID
exports.updateUser = async (req, res) => {
  const { id } = req.params;
  const { username, email, nombre, carrera, cuatrimestre, categoria, password } = req.body;

 
  let query = "UPDATE users SET ";
  const params = [];
  const fieldsToUpdate = [];

  if (username) { fieldsToUpdate.push("username = ?"); params.push(username); }
  if (email) { fieldsToUpdate.push("email = ?"); params.push(email); }
  if (nombre) { fieldsToUpdate.push("nombre = ?"); params.push(nombre); }
  if (carrera) { fieldsToUpdate.push("carrera = ?"); params.push(carrera); }
  if (cuatrimestre) { fieldsToUpdate.push("cuatrimestre = ?"); params.push(cuatrimestre); }
  if (categoria) { fieldsToUpdate.push("categoria = ?"); params.push(categoria); }
  if (password) { fieldsToUpdate.push("password = ?"); params.push(bcrypt.hashSync(password, 8));}
  
  if (fieldsToUpdate.length === 0) {
    return res.status(400).send({ message: "No fields to update provided." });
  }

  query += fieldsToUpdate.join(", ") + ", updated_at = CURRENT_TIMESTAMP WHERE id = ?";
  params.push(id);

  try {
    const [result] = await pool.query(query, params);
    if (result.affectedRows === 0) {
      return res.status(404).send({ message: `User with id ${id} not found or no changes made.` });
    }
    res.status(200).send({ message: "User updated successfully." });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      let field = error.message.includes("'users.username'") ? 'username' : 'email';
      return res.status(409).send({ message: `Error: ${field} already exists.` });
    }
    console.error(`Error updating user with id ${id}:`, error);
    res.status(500).send({ message: error.message || "Error updating User with id " + id });
  }
};

// Eliminar un usuario por ID 
exports.deleteUserById = async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await pool.query("DELETE FROM users WHERE id = ?", [id]);
    if (result.affectedRows === 0) {
      return res.status(404).send({ message: `User with id ${id} not found.` });
    }
    res.status(200).send({ message: "User deleted successfully." });
  } catch (error) {
    console.error(`Error deleting user with id ${id}:`, error);
    res.status(500).send({ message: error.message || "Could not delete User with id " + id });
  }
};

// --- Funciones de tu controlador original (adaptadas) ---

// Similar a userBoard (contenido para el usuario logueado)
exports.userBoard = (req, res) => {
  res.status(200).send({ message: "User Content. Welcome user ID: " + req.userId });
};

// Similar a tu adminBoard 
exports.adminBoard = async (req, res) => {
  try {
    // Obtener todos los usuarios
    const [allUsers] = await pool.query(
        "SELECT id, username, email, nombre, carrera, cuatrimestre, categoria FROM users"
    );

    // Obtener el id del rol 'evaluador'
    const [roleRows] = await pool.query("SELECT id FROM roles WHERE name = 'evaluador'");
    const roleIdForEvaluator = roleRows.length > 0 ? roleRows[0].id : null;

    let evaluadores = [];
    if (roleIdForEvaluator) {
      [evaluadores] = await pool.query(
        `SELECT u.id, u.username, u.email, u.nombre, u.carrera, u.cuatrimestre, u.categoria
         FROM users u
         JOIN user_roles ur ON u.id = ur.user_id
         WHERE ur.role_id = ?`, [roleIdForEvaluator]
      );
    }

    res.status(200).send({ usuarios: allUsers, evaluadores: evaluadores });
  } catch (err) {
    console.error("Error en adminBoard:", err);
    res.status(500).send({ message: err.message });
  }
};

// Nueva función para moderatorBoard
exports.moderatorBoard = (req, res) => {
  res.status(200).send({ message: "Moderator Content. Welcome moderator ID: " + req.userId });
};