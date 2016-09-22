module.exports = function (sequelize, DataTypes) {

  // sequelize.define(modelname, {attributesconfig}).
  return sequelize.define('todo', {

    description: {

      // The DataTypes object is required when using
      // sequelize.import.
      type: DataTypes.STRING,
      allowNull: false,

      // sequelize has many validations that can be
      // included in the validate obj.
      // https://goo.gl/7J34jw
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
