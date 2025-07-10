// controllers/role.controller.js
const pool = require('../config/db.pool'); 

// Crear un nuevo rol
exports.createRole = async (req, res) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).send({ message: "Role name cannot be empty!" });
  }

  try {
    const [result] = await pool.query(
      "INSERT INTO roles (name) VALUES (?)",
      [name.toLowerCase()] 
    );
    res.status(201).send({ id: result.insertId, name });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).send({ message: "Error: Role name already exists." });
    }
    console.error("Error creating role:", error);
    res.status(500).send({ message: error.message || "Some error occurred while creating the Role." });
  }
};

// Obtener todos los roles
exports.getAllRoles = async (req, res) => {
  try {
    const [roles] = await pool.query("SELECT id, name, created_at, updated_at FROM roles");
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
    const [roles] = await pool.query("SELECT id, name, created_at, updated_at FROM roles WHERE id = ?", [id]);
    if (roles.length === 0) {
      return res.status(404).send({ message: `Role with id ${id} not found.` });
    }
    res.status(200).send(roles[0]);
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
    const [result] = await pool.query(
      "UPDATE roles SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [name.toLowerCase(), id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).send({ message: `Role with id ${id} not found or no changes made.` });
    }
    res.status(200).send({ message: "Role updated successfully." });
  } catch (error) {
     if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).send({ message: "Error: Role name already exists." });
    }
    console.error(`Error updating role with id ${id}:`, error);
    res.status(500).send({ message: error.message || "Error updating Role with id " + id });
  }
};

// Eliminar un rol por ID
exports.deleteRole = async (req, res) => {
  const { id } = req.params;
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();


    const [result] = await connection.query("DELETE FROM roles WHERE id = ?", [id]);
    
    await connection.commit();

    if (result.affectedRows === 0) {
      return res.status(404).send({ message: `Role with id ${id} not found.` });
    }
    res.status(200).send({ message: "Role deleted successfully." });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error(`Error deleting role with id ${id}:`, error);
    res.status(500).send({ message: error.message || "Could not delete Role with id " + id });
  } finally {
    if (connection) connection.release();
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
    const [user] = await pool.query("SELECT id FROM users WHERE id = ?", [userId]);
    if (user.length === 0) return res.status(404).send({ message: `User with id ${userId} not found.`});
    
    const [role] = await pool.query("SELECT id FROM roles WHERE id = ?", [roleId]);
    if (role.length === 0) return res.status(404).send({ message: `Role with id ${roleId} not found.`});

    await pool.query(
      "INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)",
      [userId, roleId]
    );
    res.status(201).send({ message: "Role assigned to user successfully." });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).send({ message: "User already has this role." });
    }
    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
        let msg = "Error assigning role: ";
        if (error.message.includes("CONSTRAINT `user_roles_ibfk_1`")) {
            msg += `User with id ${userId} not found.`;
        } else if (error.message.includes("CONSTRAINT `user_roles_ibfk_2`")) {
            msg += `Role with id ${roleId} not found.`;
        } else {
            msg += error.message;
        }
        return res.status(404).send({ message: msg });
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
    const [result] = await pool.query(
      "DELETE FROM user_roles WHERE user_id = ? AND role_id = ?",
      [userId, roleId]
    );
    if (result.affectedRows === 0) {
      return res.status(404).send({ message: "Role assignment not found or user/role does not exist." });
    }
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
    const [userExists] = await pool.query("SELECT id FROM users WHERE id = ?", [userId]);
    if (userExists.length === 0) {
      return res.status(404).send({ message: `User with id ${userId} not found.` });
    }

    // Verificar permisos: solo puede ver sus propios roles o ser admin
    if (parseInt(userId) !== parseInt(requestingUserId)) {
      // Si no es el mismo usuario, verificar si es admin
      const [adminRoles] = await pool.query(
        `SELECT r.name 
         FROM roles r
         JOIN user_roles ur ON r.id = ur.role_id
         WHERE ur.user_id = ? AND r.name = 'admin'`,
        [requestingUserId]
      );
      
      if (adminRoles.length === 0) {
        return res.status(403).send({ message: "You can only view your own roles." });
      }
    }

    // Obtener los roles del usuario
    const [roles] = await pool.query(
      `SELECT r.id, r.name 
       FROM roles r
       JOIN user_roles ur ON r.id = ur.role_id
       WHERE ur.user_id = ?`,
      [userId]
    );
    
    res.status(200).send(roles);
  } catch (error) {
    console.error(`Error fetching roles for user ${userId}:`, error);
    res.status(500).send({ message: error.message || "Error fetching user roles." });
  }
};