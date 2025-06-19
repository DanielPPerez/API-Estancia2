// middleware/verifySignUp.js
const pool = require("../config/db.config");

checkDuplicateUsernameOrEmail = async (req, res, next) => {
  try {
    // Username
    let [rows] = await pool.query("SELECT * FROM users WHERE username = ?", [req.body.username]);
    if (rows.length > 0) {
      return res.status(400).send({ message: "Failed! Username is already in use!" });
    }

    // Email
    [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [req.body.email]);
    if (rows.length > 0) {
      return res.status(400).send({ message: "Failed! Email is already in use!" });
    }
    next();
  } catch (error) {
    console.error("checkDuplicateUsernameOrEmail error:", error);
    return res.status(500).send({ message: "Unable to validate Username/Email." });
  }
};

checkRolesExisted = async (req, res, next) => {
  if (req.body.roles) {
    try {
      const requestedRoles = req.body.roles.map(role => role.toLowerCase());
      // Construir la consulta IN de forma segura
      const placeholders = requestedRoles.map(() => '?').join(',');
      const [rows] = await pool.query(`SELECT name FROM roles WHERE name IN (${placeholders})`, requestedRoles);

      const foundRoles = rows.map(r => r.name);

      for (let i = 0; i < requestedRoles.length; i++) {
        if (!foundRoles.includes(requestedRoles[i])) {
          return res.status(400).send({
            message: `Failed! Role '${requestedRoles[i]}' does not exist.`,
          });
        }
      }
    } catch (error) {
      console.error("checkRolesExisted error:", error);
      return res.status(500).send({ message: "Unable to validate roles." });
    }
  }
  next();
};

const verifySignUp = {
  checkDuplicateUsernameOrEmail,
  checkRolesExisted,
};

module.exports = verifySignUp;