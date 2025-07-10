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

  UserRoles.associate = (models) => {
    // Este modelo es una tabla de unión, no necesita asociaciones adicionales
    // Las asociaciones se manejan en los modelos principales (User y Role)
  };

  return UserRoles;
};
