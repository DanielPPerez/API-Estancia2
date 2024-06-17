require('dotenv').config();

module.exports = {
  secret: process.env.JWT_SECRET_KEY,
  jwtExpiration: parseInt(process.env.JWT_EXPIRATION_TIME),
  jwtRefreshExpiration: parseInt(process.env.JWT_REFRESH_EXPIRATION_TIME),
};
