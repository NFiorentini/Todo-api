let cryptojs = require('crypto-js');

module.exports = function (db) {

  return {

    // Route-level middleware requiring the user to be logged in.
    requireAuthentication: function (req, res, next) {
      let token = req.get('Auth') || '';

      db.token.findOne({
        where: {
          tokenHash: cryptojs.MD5(token).toString()
        }
      }).then(function (tokenInstance) {
        if(!tokenInstance) {
          throw new Error();
        }

        req.token = tokenInstance;
        return db.user.findByToken(token);

      }).then(function (user) {
        req.user = user;
        next();

      }).catch(function () {
        res.status(401).send();
      });
    }
  };
};