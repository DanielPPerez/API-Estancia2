module.exports = (sequelize, DataTypes) => {
  const Role = sequelize.define("roles", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true, // Importante para PostgreSQL
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
  }, {
    timestamps: true, // Agregar createdAt y updatedAt automáticamente
    tableName: 'roles', // Asegurar nombre de tabla
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
