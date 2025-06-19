const jwt = require("jsonwebtoken");
const config = require("../config/auth.config.js");
const pool = require("../config/db.config"); 

const { TokenExpiredError } = jwt;

const catchError = (err, res) => {
  if (err instanceof TokenExpiredError) {
    return res
      .status(401)
      .send({ message: "Unauthorized! Access Token was expired!" });
  }
  console.error("JWT Verification Error:", err.message); 
  return res.status(401).send({ message: "Unauthorized!" });
};

const verifyToken = (req, res, next) => {
  let token = req.headers["x-access-token"];

  if (!token) {
    return res.status(403).send({ message: "No token provided!" });
  }

  jwt.verify(token, config.secret, (err, decoded) => {
    if (err) {
      return catchError(err, res);
    }
    req.userId = decoded.id; 
    next();
  });
};

// Función auxiliar para obtener los roles de un usuario
const getUserRoles = async (userId) => {
  try {
    const [rows] = await pool.query(
      `SELECT r.name 
       FROM roles r
       JOIN user_roles ur ON r.id = ur.role_id
       WHERE ur.user_id = ?`,
      [userId]
    );
    return rows.map(row => row.name.toLowerCase()); // Devolver nombres de roles en minúsculas
  } catch (error) {
    console.error("Error fetching user roles:", error);
    return []; 
  }
};

const isAdmin = async (req, res, next) => {
  if (!req.userId) { // Asegurarse que verifyToken se ejecutó y pobló req.userId
    return res.status(403).send({ message: "User ID not found in request. Token might be invalid or missing." });
  }
  try {
    const roles = await getUserRoles(req.userId);
    if (roles.includes("admin")) {
      next();
      return;
    }
    res.status(403).send({ message: "Require Admin Role!" });
  } catch (error) {
    console.error("isAdmin middleware error:", error);
    res.status(500).send({ message: "Error checking admin role." });
  }
};

const isModerator = async (req, res, next) => {
  if (!req.userId) {
    return res.status(403).send({ message: "User ID not found in request." });
  }
  try {
    const roles = await getUserRoles(req.userId);
    if (roles.includes("moderator")) {
      next();
      return;
    }
    res.status(403).send({ message: "Require Moderator Role!" });
  } catch (error) {
    console.error("isModerator middleware error:", error);
    res.status(500).send({ message: "Error checking moderator role." });
  }
};

const isEvaluador = async (req, res, next) => { // Añadido ejemplo para 'evaluador'
  if (!req.userId) {
    return res.status(403).send({ message: "User ID not found in request." });
  }
  try {
    const roles = await getUserRoles(req.userId);
    if (roles.includes("evaluador")) {
      next();
      return;
    }
    res.status(403).send({ message: "Require Evaluador Role!" });
  } catch (error) {
    console.error("isEvaluador middleware error:", error);
    res.status(500).send({ message: "Error checking evaluador role." });
  }
};


const isModeratorOrAdmin = async (req, res, next) => {
  if (!req.userId) {
    return res.status(403).send({ message: "User ID not found in request." });
  }
  try {
    const roles = await getUserRoles(req.userId);
    if (roles.includes("moderator") || roles.includes("admin")) {
      next();
      return;
    }
    res.status(403).send({ message: "Require Moderator or Admin Role!" });
  } catch (error) {
    console.error("isModeratorOrAdmin middleware error:", error);
    res.status(500).send({ message: "Error checking moderator/admin role." });
  }
};

const authJwt = {
  verifyToken,
  isAdmin,
  isModerator,
  isEvaluador, // Añadido
  isModeratorOrAdmin,
};
module.exports = authJwt;