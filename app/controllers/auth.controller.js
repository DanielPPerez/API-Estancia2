// controllers/auth.controller.js
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require('uuid'); 
const ms = require('ms'); 

const pool = require("../config/db.pool");
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

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // 1. Hashear contraseña
    const hashedPassword = bcrypt.hashSync(password, 8);

    // 2. Crear usuario
    const [userResult] = await connection.query(
      "INSERT INTO users (username, email, password, nombre, carrera, cuatrimestre, categoria, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())",
      [username, email, hashedPassword, nombre, carrera, cuatrimestre, categoria]
    );
    const userId = userResult.insertId;

    // 3. Asignar roles
    if (roles && roles.length > 0) {
      const [roleRows] = await connection.query(
        "SELECT id FROM roles WHERE name IN (?)",
        [roles.map(r => r.toLowerCase())] 
      );

      if (roleRows.length !== roles.length) {

        await connection.rollback();
        return res.status(400).send({ message: "One or more specified roles do not exist." });
      }

      const userRoleValues = roleRows.map(role => [userId, role.id]);
      if (userRoleValues.length > 0) {
        await connection.query(
          "INSERT INTO user_roles (userId, roleId) VALUES ?",
          [userRoleValues] // Inserción múltiple
        );
      }
    } else {
      // Asignar rol por defecto 'user' (asumiendo que existe y quieres este comportamiento)
      const [defaultRole] = await connection.query("SELECT id FROM roles WHERE name = 'user'");
      if (defaultRole.length === 0) {
        await connection.rollback();
        return res.status(500).send({ message: "Default role 'user' not found. Please configure roles." });
      }
      await connection.query(
        "INSERT INTO user_roles (userId, roleId) VALUES (?, ?)",
        [userId, defaultRole[0].id]
      );
    }

    await connection.commit();
    res.send({ message: "User registered successfully!" });

  } catch (error) {
    if (connection) await connection.rollback();
    if (error.code === 'ER_DUP_ENTRY') {
      let field = "unknown";
      if (error.message.includes("'users.username'")) field = 'username';
      if (error.message.includes("'users.email'")) field = 'email';
      return res.status(409).send({ message: `Failed! ${field} is already in use!` });
    }
    console.error("Signup error:", error);
    res.status(500).send({ message: error.message || "User registration failed." });
  } finally {
    if (connection) connection.release();
  }
};

exports.signin = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).send({ message: "Username and password are required." });
  }

  let connection;
  try {
    connection = await pool.getConnection();

    // 1. Encontrar usuario
    const [users] = await connection.query(
      "SELECT * FROM users WHERE username = ?",
      [username]
    );

    if (users.length === 0) {
      return res.status(404).send({ message: "User not found." });
    }
    const user = users[0];

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
      expiresIn: config.jwtExpiration, // ej: "12h"
    });

    // 4. Crear o actualizar Refresh Token en la BD
    const refreshTokenString = uuidv4();
    const expiryDate = getRefreshTokenExpiryDate();

   
    await connection.query("DELETE FROM refreshTokens WHERE userId = ?", [user.id]);
    await connection.query(
      "INSERT INTO refreshTokens (token, userId, expiryDate, createdAt, updatedAt) VALUES (?, ?, ?, NOW(), NOW())",
      [refreshTokenString, user.id, expiryDate]
    );

    // 5. Obtener roles del usuario
    const [roleRows] = await connection.query(
      `SELECT r.name 
       FROM roles r
       JOIN user_roles ur ON r.id = ur.roleId
       WHERE ur.userId = ?`,
      [user.id]
    );
    const authorities = roleRows.map(role => "ROLE_" + role.name.toUpperCase());

    res.status(200).send({
      id: user.id,
      username: user.username,
      email: user.email,
      nombre: user.nombre, 
      carrera: user.carrera,
      cuatrimestre: user.cuatrimestre,
      categoria: user.categoria,
      roles: authorities,
      accessToken: accessToken,
      refreshToken: refreshTokenString,
    });

  } catch (error) {
    console.error("Signin error:", error);
    res.status(500).send({ message: error.message || "Sign in failed." });
  } finally {
    if (connection) connection.release();
  }
};

exports.refreshToken = async (req, res) => {
  const { refreshToken: requestToken } = req.body;

  if (!requestToken) {
    return res.status(403).json({ message: "Refresh token is required!" });
  }

  let connection;
  try {
    connection = await pool.getConnection();

    // 1. Buscar el token de refresco en la BD
    const [tokenRows] = await connection.query(
      "SELECT * FROM refreshTokens WHERE token = ?",
      [requestToken]
    );

    if (tokenRows.length === 0) {
      return res.status(403).json({ message: "Refresh token is not in database!" });
    }
    const refreshTokenData = tokenRows[0];

    // 2. Verificar si el token de refresco ha expirado
    if (new Date(refreshTokenData.expiryDate) < new Date()) {
      // Token expirado, eliminarlo de la BD
      await connection.query("DELETE FROM refreshTokens WHERE id = ?", [refreshTokenData.id]);
      return res.status(403).json({
        message: "Refresh token was expired. Please make a new signin request.",
      });
    }

    // 3. Generar nuevo Access Token
    const newAccessToken = jwt.sign({ id: refreshTokenData.userId }, config.secret, {
      expiresIn: config.jwtExpiration,
    });

    // Opcional: Implementar "Refresh Token Rotation"
    // Si lo haces, generas un NUEVO refresh token aquí, lo guardas y devuelves el nuevo.
    // Por simplicidad, este ejemplo devuelve el mismo refresh token si aún es válido.
    // Si implementas rotación, después de generar newAccessToken:
    // const newRefreshTokenString = uuidv4();
    // const newExpiryDate = getRefreshTokenExpiryDate();
    // await connection.query("UPDATE refresh_tokens SET token = ?, expiry_date = ? WHERE id = ?",
    //   [newRefreshTokenString, newExpiryDate, refreshTokenData.id]);
    // return res.status(200).json({ accessToken: newAccessToken, refreshToken: newRefreshTokenString });


    return res.status(200).json({
      accessToken: newAccessToken,
      refreshToken: refreshTokenData.token, 
    });

  } catch (error) {
    console.error("RefreshToken error:", error);
    return res.status(500).send({ message: error.message || "Failed to refresh token." });
  } finally {
    if (connection) connection.release();
  }
};