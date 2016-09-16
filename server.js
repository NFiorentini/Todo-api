let express = require('express');
let bodyParser = require('body-parser');
let _ = require("underscore");
let db = require('./db.js');
// let bcrypt = require("bcryptjs");
let middleware = require('./middleware.js')(db);
let app = express();
let PORT = process.env.PORT || 3000;
let todos = [];
let todoNextId = 1;


// Anytime a json request comes in, Express will
// be able to parse it, & we can access it via
// req.body.
app.use(bodyParser.json());


// The Root
app.get('/', function (req, res) {
  res.send('Todo API Root');
});


// GET all todos.
app.get('/todos', function (req, res) {
  let query = req.query;
  let where = {};

  if (query.hasOwnProperty('completed') &&
      query.completed === 'true') {

    where.completed = true;

  } else if (query.hasOwnProperty('completed') &&
      query.completed === 'false') {

    where.completed = false;
  }

  if (query.hasOwnProperty('q') && query.q.length > 0) {

    where.description = {
      $like: '%' + query.q + '%'
    };
  }

  // Sequelize's findAll() lets you search by various criteria.
  db.todo.findAll({where: where}).then(function (todos) {

    res.json(todos);

  }, function (e) {
    res.status(500).send();
  });
});



// GET a specific todo.
// Express uses :id to parse the incoming data.
app.get('/todos/:id', function (req, res) {

  // params is short for "url parameters", & id is
  // the name in this case.
  // req.params are always strings & need to be
  // converted to int.
  let todoId = parseInt(req.params.id, 10);

  // Sequelize's findById() returns a Promise with that
  // object pulled from the database.
  db.todo.findById(todoId)

  // Success case.
  .then(function (todo) {

    if (!!todo) {
      res.json(todo.toJSON());
    } else {
      res.status(404).send();
    }
  },

   // Error case. 500 is a server error
   function (e) {
    res.status(500).send();
  });
});



// POST /todos enables adding new todos through
// the API.
app.post('/todos', function (req, res) {

  // _.pick() prevents the user from creating new
  // fields that would be added to a todo.
  let body = _.pick(req.body, 'description', 'completed');

  db.todo.create(body)

  // Success callback. Send back the data.
  .then(function (todo) {
    res.json(todo.toJSON());
  },

  // Error callback. Send back the error object.
  function (e) {
    res.status(400).json(e);
  });
});



// DELETE /todos/:id
app.delete('/todos/:id', function (req, res) {
  let todoId = parseInt(req.params.id, 10);

  db.todo.destroy(
      {where: {id: todoId}
  })
  .then(function (rowsDeleted) {

    if(rowsDeleted === 0) {

      res.status(404).json(
          {error: 'No todo with id'}
      );

    } else {

      // 204: Everything went well & there's
      // nothing to send back.
      res.status(204).send();
    }
  }, function () {
    res.status(500).send();
  });
});



// PUT /todos/:id
app.put('/todos/:id', function (req, res) {
  let todoId = parseInt(req.params.id, 10);

  // id & any unnecessary fields are removed.
  let body = _.pick(req.body, 'description', 'completed');

  // attributes stores values that we want to
  // update on the items in our todos array.
  let attributes = {};

  if (body.hasOwnProperty('completed')) {
    attributes.completed = body.completed;
  }

  if (body.hasOwnProperty('description')) {
    attributes.description = body.description;
  }

  db.todo.findById(todoId).then(function (todo) {

    if(todo) {
      todo.update(attributes).then(function (todo) {
        res.json(todo.toJSON());

      }, function (e) {
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



app.post('/users/login', function (req, res) {
  let body = _.pick(req.body, 'email', 'password');

  // Returns a promise.
  db.user.authenticate(body)

  // Success case.
  .then(function (user) {
    let token = user.generateToken('authentication');

    if(token) {

      // toPublicJSON() returns only the fields we
      // want to expose.
      res.header('Auth', token).json(user.toPublicJSON());
    } else {
      res.status(401).send();
    }

  // Error case.
  }, function () {
    res.status(401).send();
  });
});



// db.sequelize.sync({force: true}) removes the database
// when the server starts.
db.sequelize.sync({force: true}).then(function () {

  app.listen(PORT, function () {

    console.log('Express listening & caring on port ' +
        PORT + '!');
  });
});


