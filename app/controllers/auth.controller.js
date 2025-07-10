// controllers/auth.controller.js
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require('uuid'); 
const ms = require('ms'); 

const db = require("../models");
const config = require("../config/auth.config"); 

// Función para convertir la duración del refresh token a una fecha de expiración
const getRefreshTokenExpiryDate = () => {
  const durationMs = ms(config.jwtRefreshExpiration);
  return new Date(Date.now() + durationMs);
};

exports.signup = async (req, res) => {
  const { username, email, password, nombre, carrera, cuatrimestre, categoria, roles } = req.body;

  if (!username || !email || !password) {
    return res.status(400).send({ message: "Username, email, and password are required." });
  }

  try {
    // 1. Hashear contraseña
    const hashedPassword = bcrypt.hashSync(password, 8);

    // 2. Crear usuario usando Sequelize
    const user = await db.user.create({
      username,
      email,
      password: hashedPassword,
      nombre,
      carrera,
      cuatrimestre,
      categoria
    });

    // 3. Asignar roles - Limpiar prefijos ROLE_ si existen
    if (roles && roles.length > 0) {
      const cleanRoles = roles.map(role => {
        // Remover prefijo ROLE_ si existe y convertir a minúsculas
        return role.replace(/^role_/i, '').toLowerCase();
      });

      const roleObjects = await db.role.findAll({
        where: {
          name: cleanRoles
        }
      });

      if (roleObjects.length !== cleanRoles.length) {
        return res.status(400).send({ message: "One or more specified roles do not exist." });
      }

      await user.setRoles(roleObjects);
    } else {
      // Asignar rol por defecto 'user'
      const defaultRole = await db.role.findOne({
        where: { name: 'user' }
      });
      
      if (!defaultRole) {
        return res.status(500).send({ message: "Default role 'user' not found. Please configure roles." });
      }
      
      await user.setRoles([defaultRole]);
    }

    res.send({ message: "User registered successfully!" });

  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      let field = "unknown";
      if (error.fields && error.fields.username) field = 'username';
      if (error.fields && error.fields.email) field = 'email';
      return res.status(409).send({ message: `Failed! ${field} is already in use!` });
    }
    console.error("Signup error:", error);
    res.status(500).send({ message: error.message || "User registration failed." });
  }
};

exports.signin = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).send({ message: "Username and password are required." });
  }

  try {
    // 1. Encontrar usuario usando Sequelize
    const user = await db.user.findOne({
      where: { username },
      include: [{
        model: db.role,
        through: db.user_roles,
        attributes: ['name']
      }]
    });

    if (!user) {
      return res.status(404).send({ message: "User not found." });
    }

    // 2. Validar contraseña
    const passwordIsValid = bcrypt.compareSync(password, user.password);
    if (!passwordIsValid) {
      return res.status(401).send({
        accessToken: null,
        message: "Invalid Password!",
      });
    }

    // 3. Generar Access Token
    const accessToken = jwt.sign({ id: user.id }, config.secret, {
      expiresIn: config.jwtExpiration,
    });

    // 4. Crear o actualizar Refresh Token
    const refreshTokenString = uuidv4();
    const expiryDate = getRefreshTokenExpiryDate();

    // Eliminar tokens anteriores del usuario
    await db.refreshToken.destroy({
      where: { userId: user.id }
    });

    // Crear nuevo token
    await db.refreshToken.create({
      token: refreshTokenString,
      userId: user.id,
      expiryDate
    });

    // 5. Obtener roles del usuario - DEVOLVER NOMBRES SIN PREFIJO
    const roleNames = user.roles.map(role => role.name);

    res.status(200).send({
      id: user.id,
      username: user.username,
      email: user.email,
      nombre: user.nombre, 
      carrera: user.carrera,
      cuatrimestre: user.cuatrimestre,
      categoria: user.categoria,
      roles: roleNames, // Cambiado: devolver nombres de roles sin prefijo
      accessToken: accessToken,
      refreshToken: refreshTokenString,
    });

  } catch (error) {
    console.error("Signin error:", error);
    res.status(500).send({ message: error.message || "Sign in failed." });
  }
};

exports.refreshToken = async (req, res) => {
  const { refreshToken: requestToken } = req.body;

  if (!requestToken) {
    return res.status(403).json({ message: "Refresh token is required!" });
  }

  try {
    // 1. Buscar el token de refresco usando Sequelize
    const refreshToken = await db.refreshToken.findOne({
      where: { token: requestToken }
    });

    if (!refreshToken) {
      return res.status(403).json({ message: "Refresh token is not in database!" });
    }

    // 2. Verificar si el token de refresco ha expirado
    if (refreshToken.expiryDate < new Date()) {
      // Token expirado, eliminarlo
      await refreshToken.destroy();
      return res.status(403).json({
        message: "Refresh token was expired. Please make a new signin request.",
      });
    }

    // 3. Generar nuevo Access Token
    const newAccessToken = jwt.sign({ id: refreshToken.userId }, config.secret, {
      expiresIn: config.jwtExpiration,
    });

    return res.status(200).json({
      accessToken: newAccessToken,
      refreshToken: refreshToken.token, 
    });

  } catch (error) {
    console.error("RefreshToken error:", error);
    return res.status(500).send({ message: error.message || "Failed to refresh token." });
  }
};