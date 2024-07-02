module.exports = (sequelize, DataTypes) => {
  const Role = sequelize.define("roles", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
    },
  });

  Role.associate = (models) => {
    Role.belongsToMany(models.user, {
      through: models.user_roles,
      foreignKey: "roleId",
      otherKey: "userId",
    });
  };

  return Role;
};
