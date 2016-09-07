var express = require('express');
var bodyParser = require('body-parser');
var _ = require("underscore");
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
  res.json(todos);
});


// GET a specific todo.
// Express uses :id to parse the incoming data.
app.get('/todos/:id', function (req, res) {

  // params is short for "url parameters", & id is
  // the name in this case.
  // req.params are always strings & need to be
  // converted to int.
  var todoId = parseInt(req.params.id, 10);

  // _.findWhere(list, {key: "value", key: value,...})
  // Returns the FIRST value that matches the
  // key-value pairs.
  var matchedTodo = _.findWhere(todos, {id: todoId});

  // Pass the matchedTodo to json or send
  // status 404.
  if(matchedTodo) {

    // .json() is shortcut to set a response
    // on Express.
    res.json(matchedTodo);
  } else {

    // The requested resource was not found.
    res.status(404).send();
  }
});


// POST /todos enables adding new todos through
// the API.
app.post('/todos', function (req, res) {

  // _.pick() prevents the user from creating new
  // fields that would be added to a todo.
  var body = _.pick(req.body, 'description', 'completed');

  if(!_.isBoolean(body.completed) ||
      !_.isString(body.description) ||
      body.description.trim().length === 0) {

    // The request can't be completed because bad
    // data was provided.
    return res.status(400).send();
  }

  // .trim() removes whitespaces at the beginning
  // & the end. Inner whitespace isn't removed.
  body.description = body.description.trim();

  // Assign todoNextId to body.id, then increment
  // todoNextId by 1.
  body.id = todoNextId++;

  // Push the todo to the todos array.
  todos.push(body);

  res.json(body);

});


// DELETE /todos/:id
app.delete('/todos/:id', function (req, res) {
  var todoId = parseInt(req.params.id, 10);

  // _.findWhere(list, {key: "value", key: value,...})
  // Returns the FIRST value that matches the
  // key-value pairs.
  var matchedTodo = _.findWhere(todos, {id: todoId});

  if(!matchedTodo) {

    res.status(404).json(
        {"error": "No todo found with that id"});

  } else {
    todos = _.without(todos, matchedTodo);

    // By default, .json() sets the http status
    // to 200 (OK).
    res.json(matchedTodo);
  }
});


// PUT /todos/:id
app.put('/todos/:id', function (req, res) {

  var todoId = parseInt(req.params.id, 10);
  var matchedTodo = _.findWhere(todos, {id: todoId});

  // id & any unnecessary fields are removed.
  var body = _.pick(req.body, 'description', 'completed');

  // validAttributes stores values that we want to
  // update on the items in our todos array.
  var validAttributes = {};

  if(!matchedTodo) {
    return res.status(404).send();
  }

  if(body.hasOwnProperty('completed') &&
      _.isBoolean(body.completed)) {

    validAttributes.completed = body.completed;

  // Runs only if completed isn't a boolean.
  } else if(body.hasOwnProperty('completed')) {
    return res.status(400).send();
  }

  if(body.hasOwnProperty('description') &&
      _.isString(body.description) &&
      body.description.trim().length > 0) {

    validAttributes.description = body.description;

  } else if(body.hasOwnProperty('description')) {
    return res.status(400).send();
  }

  // .extend({destKey: destVal}, {srcKey: srcVal})
  // copies the source objects over to the destination
  // object, overriding like values if necessary,
  // & returns the destination object.
  _.extend(matchedTodo, validAttributes);

  res.json(matchedTodo);
});



app.listen(PORT, function () {

  console.log('Express listening & caring on port ' +
      PORT + '!');
});