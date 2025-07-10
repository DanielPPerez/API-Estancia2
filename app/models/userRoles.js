module.exports = (sequelize, DataTypes) => {
  const UserRoles = sequelize.define("user_roles", {
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    roleId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  }, {
    timestamps: true, // Agregar createdAt y updatedAt automáticamente
    tableName: 'user_roles', // Asegurar nombre de tabla
  });

  return UserRoles;
};
