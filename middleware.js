module.exports = function (db) {

  return {

    // Route-level middleware requiring the user to be logged in.
    requireAuthentication: function (req, res, next) {
      let token = req.get('Auth');

      db.user.findByToken(token)
          .then(function (user) {

            req.user = user;

            // Tell Express to move on.
            next();

          }, function () {
            res.status(401).send();
          });
    }
  };
};