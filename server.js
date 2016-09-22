let bodyParser = require('body-parser');
let PORT       = process.env.PORT || 3000;
let express    = require('express');
let _          = require("underscore");
let db         = require('./db.js');
let app        = express();
let todos      = [];

let middleware = require('./middleware.js')(db);

// Anytime a json request comes in, Express will
// be able to parse it, & we can access it via
// req.body.
app.use(bodyParser.json());



// Root.
app.get('/', function (req, res) {
  res.send('Todo API Root');
});



// READ. GET all todos.
app.get('/todos', middleware.requireAuthentication,
    function (req, res) {

      let query = req.query;

      let where = {
        userId: req.user.get('id')
      };

      // hasOwnProperty() is a js Object method that determines
      // whether an object has the specified property as a
      // direct property of that object.
      if(query.hasOwnProperty('completed') &&
          query.completed === 'true') {

        where.completed = true;

      } else if(query.hasOwnProperty('completed') &&
          query.completed === 'false') {

        where.completed = false;
      }

      if(query.hasOwnProperty('q') && query.q.length > 0) {

        where.description = {

          // sequelize's $like enables searching for an
          // exact value. '%' indicates we don't care about
          // content on either side of the word.
          $like: '%' + query.q + '%'
        };
      }

      // sequelize's findAll() lets you search by various
      // criteria. https://goo.gl/eTDz7d
      db.todo.findAll({where: where}).then(function (todos) {

        res.json(todos);

      }, function (e) {
        res.status(500).send();
      });
    });




// GET a specific todo.
// Express uses :id to parse the incoming data.
app.get('/todos/:id', middleware.requireAuthentication,
    function (req, res) {

      // params is short for "url parameters", & id is
      // the name in this case.
      // req.params are always strings & need to be
      // converted to int.
      let todoId = parseInt(req.params.id, 10);

      db.todo.findOne({
        where: {
          id: todoId,
          userId: req.user.get('id')
        }
      })

      // Success case.
      .then(function (todo) {

            if(!!todo) {
              res.json(todo.toJSON());
            } else {

              // 404 - not found.
              res.status(404).send();
            }
          },

          // Error case. 500 is a server error.
          function (e) {
            res.status(500).send();
          });
    });




// CREATE.
app.post('/todos', middleware.requireAuthentication,
    function (req, res) {

      // _.pick() returns a copy of the object, filtered to
      // only have the values for the whitelisted keys (or
      // or an array of valid keys). This prevents adding
      // new fields to a todo.
      let body = _.pick(req.body, 'description', 'completed');

      // todo.create(obj) takes the object of attributes
      // that you want to save.
      db.todo.create(body)

      // Success callback. Send back the data.
      .then(function (todo) {

            // res.json(todo.toJSON());
            req.user.addTodo(todo).then(function () {

              return todo.reload();

            }).then (function (todo) {
              res.json(todo.toJSON());
            });
          },

          // Error callback. Send back the error object.
          function (e) {
            res.status(400).json(e);
          });
    });




// DELETE. DELETE /todos/:id.
app.delete('/todos/:id', middleware.requireAuthentication,
    function (req, res) {

      let todoId = parseInt(req.params.id, 10);

      db.todo.destroy({
        where: {
          id: todoId,
          userId: req.user.get('id')
        }
      })
      .then(function (rowsDeleted) {

        if(rowsDeleted === 0) {

          res.status(404).json({error: 'No todo with id'});

        } else {

          // 204: Everything went well & there's
          // nothing to send back.
          res.status(204).send();
        }
      }, function () {
        res.status(500).send();
      });
    });




// UPDATE. PUT /todos/:id.
app.put('/todos/:id', middleware.requireAuthentication,
    function (req, res) {

      let todoId = parseInt(req.params.id, 10);

      // id & any unnecessary fields are removed.
      let body = _.pick(req.body, 'description', 'completed');

      // attributes stores values that we want to
      // update on the items in our todos array.
      let attributes = {};

      if(body.hasOwnProperty('completed')) {
        attributes.completed = body.completed;
      }

      if(body.hasOwnProperty('description')) {
        attributes.description = body.description;
      }

      db.todo.findOne({
        where: {
          id: todoId,
          userId: req.user.get('id')
        }
      })
      .then(function (todo) {

        if(todo) {
          todo.update(attributes).then(function (todo) {

            res.json(todo.toJSON());

          }, function (e) {

            // 400 - bad syntax.
            res.status(400).json(e);
          });

        } else {
          res.status(404).send();
        }
      }, function () {
        res.status(500).send();
      });
    });




app.post('/users', function (req, res) {

  // Filter data that's been seen to the request.
  let body = _.pick(req.body, 'email', 'password');

  // create() returns a Promise...
  db.user.create(body)

  // ...meaning we can call then() with two functions:
  // the success case...
  .then(function (user) {
    res.json(user.toPublicJSON());

    // ...& the error case.
  }, function (e) {
    res.status(400).json(e);
  });
});




// POST /users/login.
app.post('/users/login', function (req, res) {

  let body = _.pick(req.body, 'email', 'password');
  let userInstance;

  // Returns a promise.
  db.user.authenticate(body)

  // Success case.
  .then(function (user) {

    let token = user.generateToken('authentication');
    userInstance = user;

    return db.token.create({
      token: token
    });

  }).then(function (tokenInstance) {

    res.header('Auth', tokenInstance.get('token'))
    .json(userInstance.toPublicJSON());

  }).catch(function () {
    res.status(401).send();
  });
});




// DELETE /users/login.
app.delete('/users/login', middleware.requireAuthentication,
    function (req, res) {

      req.token.destroy().then(function () {
        res.status(204).send();

      }).catch(function () {
        res.status(500).send();
      });
    });




// sequelize allows us to manage our data as js
// objects & arrays, & does the hard work of
// converting to SQLite calls, & it works
// with many different types of databases.

// sequelize.sync() creates the tables if they
// don't already exist & returns a promise.

// db.sequelize.sync({force: true}) drops the
// database when the server starts.
db.sequelize.sync().then(function () {

  app.listen(PORT, function () {

    console.log('Express listening & caring on port ' +
        PORT + '!');
  });
});
