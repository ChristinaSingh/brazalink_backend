const { DataTypes } = require("sequelize");

module.exports = (sequelize, Sequelize) => {
  const Auth = sequelize.define(
    "auth",
    {
      phone: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      timestamps: true,
      tableName: "auth",
    }
  );

  return Auth;
};
