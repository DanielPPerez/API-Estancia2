// middleware/index.js
const authJwt = require("./authJwt");
const verifySignUp = require("./verifySignUp");
// const uploadFilesMiddleware = require("./uploadFiles"); // Si tienes este middleware, también debería estar aquí

module.exports = {
  authJwt,
  verifySignUp,
  // uploadFilesMiddleware // Descomenta si lo tienes
};