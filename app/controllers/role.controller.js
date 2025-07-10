// controllers/role.controller.js
const db = require('../models'); 

// Crear un nuevo rol
exports.createRole = async (req, res) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).send({ message: "Role name cannot be empty!" });
  }

  try {
    const role = await db.role.create({
      name: name.toLowerCase()
    });
    res.status(201).send({ id: role.id, name: role.name });
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).send({ message: "Error: Role name already exists." });
    }
    console.error("Error creating role:", error);
    res.status(500).send({ message: error.message || "Some error occurred while creating the Role." });
  }
};

// Obtener todos los roles
exports.getAllRoles = async (req, res) => {
  try {
    const roles = await db.role.findAll({
      attributes: ['id', 'name', 'createdAt', 'updatedAt']
    });
    res.status(200).send(roles);
  } catch (error) {
    console.error("Error fetching roles:", error);
    res.status(500).send({ message: error.message || "Some error occurred while retrieving roles." });
  }
};

// Obtener un rol por ID
exports.getRoleById = async (req, res) => {
  const { id } = req.params;
  try {
    const role = await db.role.findByPk(id, {
      attributes: ['id', 'name', 'createdAt', 'updatedAt']
    });
    
    if (!role) {
      return res.status(404).send({ message: `Role with id ${id} not found.` });
    }
    
    res.status(200).send(role);
  } catch (error) {
    console.error(`Error fetching role with id ${id}:`, error);
    res.status(500).send({ message: error.message || "Error retrieving Role with id " + id });
  }
};

// Actualizar un rol por ID
exports.updateRole = async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;

  if (!name) {
    return res.status(400).send({ message: "Role name cannot be empty!" });
  }

  try {
    const role = await db.role.findByPk(id);
    if (!role) {
      return res.status(404).send({ message: `Role with id ${id} not found.` });
    }

    await role.update({ name: name.toLowerCase() });
    res.status(200).send({ message: "Role updated successfully." });
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).send({ message: "Error: Role name already exists." });
    }
    console.error(`Error updating role with id ${id}:`, error);
    res.status(500).send({ message: error.message || "Error updating Role with id " + id });
  }
};

// Eliminar un rol por ID
exports.deleteRole = async (req, res) => {
  const { id } = req.params;

  try {
    const role = await db.role.findByPk(id);
    if (!role) {
      return res.status(404).send({ message: `Role with id ${id} not found.` });
    }

    await role.destroy();
    res.status(200).send({ message: "Role deleted successfully." });
  } catch (error) {
    console.error(`Error deleting role with id ${id}:`, error);
    res.status(500).send({ message: error.message || "Could not delete Role with id " + id });
  }
};

// --- Manejo de user_roles ---

// Asignar un rol a un usuario
exports.assignRoleToUser = async (req, res) => {
  const { userId, roleId } = req.body;
  if (!userId || !roleId) {
    return res.status(400).send({ message: "User ID and Role ID are required." });
  }

  try {
    // Verificar si el usuario y el rol existen 
    const user = await db.user.findByPk(userId);
    if (!user) return res.status(404).send({ message: `User with id ${userId} not found.`});
    
    const role = await db.role.findByPk(roleId);
    if (!role) return res.status(404).send({ message: `Role with id ${roleId} not found.`});

    await user.addRole(role);
    res.status(201).send({ message: "Role assigned to user successfully." });
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).send({ message: "User already has this role." });
    }
    console.error("Error assigning role to user:", error);
    res.status(500).send({ message: error.message || "Error assigning role." });
  }
};

// Remover un rol de un usuario
exports.removeRoleFromUser = async (req, res) => {
  const { userId, roleId } = req.params; 
  if (!userId || !roleId) {
    return res.status(400).send({ message: "User ID and Role ID are required." });
  }
  
  try {
    const user = await db.user.findByPk(userId);
    if (!user) {
      return res.status(404).send({ message: `User with id ${userId} not found.` });
    }

    const role = await db.role.findByPk(roleId);
    if (!role) {
      return res.status(404).send({ message: `Role with id ${roleId} not found.` });
    }

    await user.removeRole(role);
    res.status(200).send({ message: "Role removed from user successfully." });
  } catch (error) {
    console.error("Error removing role from user:", error);
    res.status(500).send({ message: error.message || "Error removing role." });
  }
};

// Obtener los roles de un usuario específico
exports.getUserRoles = async (req, res) => {
  const { userId } = req.params;
  const requestingUserId = req.userId; // ID del usuario que hace la petición
  
  try {
    // Verificar que el usuario existe
    const user = await db.user.findByPk(userId);
    if (!user) {
      return res.status(404).send({ message: `User with id ${userId} not found.` });
    }

    // Verificar permisos: solo puede ver sus propios roles o ser admin
    if (parseInt(userId) !== parseInt(requestingUserId)) {
      // Si no es el mismo usuario, verificar si es admin
      const requestingUser = await db.user.findByPk(requestingUserId, {
        include: [{
          model: db.role,
          through: db.user_roles,
          where: { name: 'admin' }
        }]
      });
      
      if (!requestingUser || requestingUser.roles.length === 0) {
        return res.status(403).send({ message: "You can only view your own roles." });
      }
    }

    // Obtener los roles del usuario
    const userWithRoles = await db.user.findByPk(userId, {
      include: [{
        model: db.role,
        through: db.user_roles,
        attributes: ['id', 'name']
      }]
    });
    
    res.status(200).send(userWithRoles.roles);
  } catch (error) {
    console.error(`Error fetching roles for user ${userId}:`, error);
    res.status(500).send({ message: error.message || "Error fetching user roles." });
  }
};