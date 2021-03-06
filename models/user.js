let cryptojs = require('crypto-js');
let jwt = require('jsonwebtoken');
let bcrypt = require('bcryptjs');
let _ = require('underscore');

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

      // VIRTUAL isn't stored in the database, but
      // it is still accessible.
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

        // Don't want to call toLowerCase() on
        // numbers or undefined!
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
      },
      findByToken: function (token) {

        return new Promise(function (resolve, reject) {

          try {
            let decodedJWT = jwt.verify(token, 'qwerty098');

            let bytes = cryptojs.AES.decrypt(
                decodedJWT.token, 'abc123!@#!');

            let tokenData = JSON.parse(bytes.toString(
                cryptojs.enc.Utf8));

            // sequelize's findById(Number/String/Buffer)
            // returns a Promise with that object pulled
            // from the database.
            user.findById(tokenData.id).then(function (user) {

              if(user) {
                resolve(user);

                // reject() if the id doesn't exist in the database.
              } else {
                reject();
              }

              // reject() if findById fails, e.g., if database
              // wasn't connected.
            }, function (e) {
              reject();
            });

            // reject() if the token isn't a valid format.
          } catch (e){
            reject();
          }
        });
      }
    },
    instanceMethods: {

      toPublicJSON: function () {
        let json = this.toJSON();

        return _.pick(json, 'id', 'email', 'createdAt',
            'updatedAt');
      },
      generateToken: function (type) {

        if(!_.isString(type)) {
          return undefined;
        }

        try {
          let stringData = JSON.stringify(
              {
                id: this.get('id'),
                type: type
              });

          // cryptojs password is 'abc123!@#!'. Could be
          // any random string.
          let encryptedData = cryptojs.AES.encrypt(
              stringData, 'abc123!@#!').toString();

          // jwt password is 'qwerty098'.
          let token = jwt.sign({
            token: encryptedData
          }, 'qwerty098');

          return token;

        } catch (e) {
          console.error(e);
          return undefined;
        }
      }
    }
  });
  return user;
};
