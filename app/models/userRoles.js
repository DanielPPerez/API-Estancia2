module.exports = (sequelize, DataTypes) => {
  const UserRoles = sequelize.define("user_roles", {
    userId: {
      type: DataTypes.INTEGER,
    },
    roleId: {
      type: DataTypes.INTEGER,
    },
  });

  return UserRoles;
};
