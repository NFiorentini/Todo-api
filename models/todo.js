module.exports = function (sequelize, DataTypes) {

  return sequelize.define('todo', {

    description: {

      // The DataTypes object is required when using
      // sequelize.import.
      type: DataTypes.STRING,
      allowNull: false,
      validate: {

        // length must be between 1 & 250 chars.
        len: [1, 250]
      }
    },

    completed: {
      type: DataTypes.BOOLEAN,
      allowNull: false,

      // If a completed status isn't provided,
      // default it to false.
      defaultValue: false
    }
  });
};