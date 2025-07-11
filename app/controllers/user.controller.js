// controllers/user.controller.js
const db = require('../models');
const bcrypt = require('bcryptjs');

// Obtener referencias a los modelos con nombres correctos
const User = db.users;
const Role = db.roles;
const UserRoles = db.user_roles;

exports.createUser = async (req, res) => {
  const { username, email, password, nombre, carrera, cuatrimestre, categoria } = req.body;

  if (!username || !email || !password) {
    return res.status(400).send({ message: "Username, email, and password are required." });
  }

  try {
    const hashedPassword = bcrypt.hashSync(password, 8);
    const user = await db.users.create({
      username,
      email,
      password: hashedPassword,
      nombre,
      carrera,
      cuatrimestre,
      categoria
    });
    res.status(201).send({ id: user.id, username, email, message: "User created successfully." });
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      let field = error.fields && error.fields.username ? 'username' : 'email';
      return res.status(409).send({ message: `Error: ${field} already exists.` });
    }
    console.error("Error creating user:", error);
    res.status(500).send({ message: error.message || "Some error occurred while creating the User." });
  }
};

// Obtener todos los usuarios 
exports.getAllUsers = async (req, res) => {
  try {
    const users = await db.users.findAll({
      attributes: ['id', 'username', 'email', 'nombre', 'carrera', 'cuatrimestre', 'categoria', 'createdAt'],
      include: [{
        model: db.roles,
        through: db.user_roles,
        attributes: ['name']
      }]
    });
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
    const user = await db.users.findByPk(id, {
      attributes: ['id', 'username', 'email', 'nombre', 'carrera', 'cuatrimestre', 'categoria', 'createdAt'],
      include: [{
        model: db.roles,
        through: db.user_roles,
        attributes: ['id', 'name']
      }]
    });
    
    if (!user) {
      return res.status(404).send({ message: `User with id ${id} not found.` });
    }
    
    res.status(200).send(user);
  } catch (error) {
    console.error(`Error fetching user with id ${id}:`, error);
    res.status(500).send({ message: error.message || "Error retrieving User with id " + id });
  }
};

// Actualizar un usuario por ID
exports.updateUser = async (req, res) => {
  const { id } = req.params;
  const { username, email, nombre, carrera, cuatrimestre, categoria, password } = req.body;

  try {
    const user = await db.users.findByPk(id);
    if (!user) {
      return res.status(404).send({ message: `User with id ${id} not found.` });
    }

    const updateData = {};
    if (username) updateData.username = username;
    if (email) updateData.email = email;
    if (nombre) updateData.nombre = nombre;
    if (carrera) updateData.carrera = carrera;
    if (cuatrimestre) updateData.cuatrimestre = cuatrimestre;
    if (categoria) updateData.categoria = categoria;
    if (password) updateData.password = bcrypt.hashSync(password, 8);

    if (Object.keys(updateData).length === 0) {
      return res.status(400).send({ message: "No fields to update provided." });
    }

    await user.update(updateData);
    res.status(200).send({ message: "User updated successfully." });
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      let field = error.fields && error.fields.username ? 'username' : 'email';
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
    const user = await db.users.findByPk(id);
    if (!user) {
      return res.status(404).send({ message: `User with id ${id} not found.` });
    }
    
    await user.destroy();
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
    const allUsers = await db.users.findAll({
      attributes: ['id', 'username', 'email', 'nombre', 'carrera', 'cuatrimestre', 'categoria'],
      include: [{
        model: db.roles,
        through: db.user_roles,
        attributes: ['name']
      }]
    });

    // Obtener evaluadores
    const evaluadores = await db.users.findAll({
      attributes: ['id', 'username', 'email', 'nombre', 'carrera', 'cuatrimestre', 'categoria'],
      include: [{
        model: db.roles,
        through: db.user_roles,
        where: { name: 'evaluador' },
        attributes: ['name']
      }]
    });

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

// --- NUEVAS FUNCIONES PARA MANEJO DE ROLES ---

// Asignar rol a usuario
exports.assignRoleToUser = async (req, res) => {
  const { userId, roleId } = req.body;

  if (!userId || !roleId) {
    return res.status(400).send({ message: "User ID and Role ID are required." });
  }

  try {
    const user = await db.users.findByPk(userId);
    if (!user) {
      return res.status(404).send({ message: "User not found." });
    }

    const role = await db.roles.findByPk(roleId);
    if (!role) {
      return res.status(404).send({ message: "Role not found." });
    }

    await user.addRole(role);
    res.status(200).send({ message: "Role assigned successfully." });
  } catch (error) {
    console.error("Error assigning role:", error);
    res.status(500).send({ message: error.message || "Error assigning role to user." });
  }
};

// Remover rol de usuario
exports.removeRoleFromUser = async (req, res) => {
  const { userId, roleId } = req.params;

  try {
    const user = await db.users.findByPk(userId);
    if (!user) {
      return res.status(404).send({ message: "User not found." });
    }

    const role = await db.roles.findByPk(roleId);
    if (!role) {
      return res.status(404).send({ message: "Role not found." });
    }

    await user.removeRole(role);
    res.status(200).send({ message: "Role removed successfully." });
  } catch (error) {
    console.error("Error removing role:", error);
    res.status(500).send({ message: error.message || "Error removing role from user." });
  }
};

// Obtener roles de un usuario
exports.getUserRoles = async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await db.users.findByPk(userId, {
      include: [{
        model: db.roles,
        through: db.user_roles,
        attributes: ['id', 'name']
      }]
    });

    if (!user) {
      return res.status(404).send({ message: "User not found." });
    }

    res.status(200).send(user.roles);
  } catch (error) {
    console.error("Error fetching user roles:", error);
    res.status(500).send({ message: error.message || "Error fetching user roles." });
  }
};