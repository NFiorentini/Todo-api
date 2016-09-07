var express = require('express');
var bodyParser = require('body-parser');
var _ = require("underscore");
var db = require('./db.js');
var app = express();
var PORT = process.env.PORT || 3000;
var todos = [];
var todoNextId = 1;


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
  var query = req.query;
  var where = {};

  if(query.hasOwnProperty('completed') &&
      query.completed === 'true') {

    where.completed = true;

  } else if(query.hasOwnProperty('completed') &&
      query.completed === 'false') {

    where.completed = false;
  }

  if(query.hasOwnProperty('q') && query.q.length > 0) {

    where.description = {
      $like: '%' + query.q + '%'
    };
  }

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
  var todoId = parseInt(req.params.id, 10);

  db.todo.findById(todoId).then(function (todo) {

    if(!!todo) {
      res.json(todo.toJSON());
    } else {
      res.status(404).send();
    }
  }, function (e) {

    res.status(500).send();
  });
});


// POST /todos enables adding new todos through
// the API.
app.post('/todos', function (req, res) {

  // _.pick() prevents the user from creating new
  // fields that would be added to a todo.
  var body = _.pick(req.body, 'description', 'completed');

  db.todo.create(body).then(function (todo) {
    res.json(todo.toJSON());

  }, function (e) {
    res.status(400).json(e);
  });
});


// DELETE /todos/:id
app.delete('/todos/:id', function (req, res) {
  var todoId = parseInt(req.params.id, 10);

  db.todo.destroy({
    where: {
      id: todoId
    }
  }).then(function (rowsDeleted) {

    if(rowsDeleted === 0) {

      res.status(404).json({
        error: 'No todo with id'
      });
    } else {

      // 204: Everything went well & there's nothing
      // to send back.
      res.status(204).send();
    }
  }, function () {
    res.status(500).send();
  });
});


// PUT /todos/:id
app.put('/todos/:id', function (req, res) {
  var todoId = parseInt(req.params.id, 10);

  // id & any unnecessary fields are removed.
  var body = _.pick(req.body, 'description', 'completed');

  // validAttributes stores values that we want to
  // update on the items in our todos array.
  var attributes = {};

  if(body.hasOwnProperty('completed')) {

    attributes.completed = body.completed;
  }

  if(body.hasOwnProperty('description')) {

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

  })
});


db.sequelize.sync().then(function () {

  app.listen(PORT, function () {

    console.log('Express listening & caring on port ' +
        PORT + '!');
  });
});


