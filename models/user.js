let bcrypt = require('bcryptjs');
let _ = require('underscore');
let cryptojs = require('crypto-js');
let jwt = require('jsonwebtoken');

// Same args as todo.js.
module.exports = function (sequelize, DataTypes) {

  let user = sequelize.define('user', {
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,

      // Built-in sequelize attribute that does
      // the complex email validation.
      validate: {
        isEmail: true
      }
    },
    salt: {
      type: DataTypes.STRING
    },
    password_hash: {
      type: DataTypes.STRING
    },
    password: {
      type: DataTypes.VIRTUAL,
      allowNull: false,
      validate: {
        len: [7, 100]
      },
      set: function (value) {
        let salt = bcrypt.genSaltSync(10);
        let hashedPassword = bcrypt.hashSync(value, salt);

        this.setDataValue('password', value);
        this.setDataValue('salt', salt);
        this.setDataValue('password_hash', hashedPassword);
      }
    }
  }, {
    hooks: {

      // Sanitizing email input.
      beforeValidate: function (user, options) {
        if(typeof user.email === 'string') {
          user.email = user.email.toLowerCase();
        }
      }
    },
    classMethods: {
      authenticate: function (body) {
        return new Promise(function (resolve, reject) {

          if(typeof body.email !== 'string' ||
              typeof body.password !== 'string') {

            return reject();
          }

          user.findOne({
            where: {
              email: body.email
            }
          }).then(function (user) {

            if(!user || !bcrypt.compareSync(body.password,
                    user.get('password_hash'))) {

              return reject();
            }
            resolve(user);

          }, function (e) {
            reject();
          });
        });
      }
    },
    instanceMethods: {

      toPublicJSON: function () {
        let json = this.toJSON();

        return _.pick(json, 'id', 'email', 'createdAt',
            'updatedAt');
      },
      generateToken : function (type) {

        if(!_.isString(type)) {
          return undefined;
        }

        try {

          let stringData = JSON.stringify(
              {id: this.get('id'),
              type: type});

          let encryptedData = cryptojs.AES.encrypt(
              stringData, 'abc123!@#!').toString();

          let token = jwt.sign({
            token: encryptedData
          }, 'qwerty098');

          return token;
        }catch (e) {
          console.error(e);
          return undefined;
        }
      }
    }
  });

  return user;
};