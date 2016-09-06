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


  //.findWhere(list, {key: "value", key: value,...})
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

  // .pick() prevents the user from creating new
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

  //.findWhere(list, {key: "value", key: value,...})
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



app.listen(PORT, function () {

  console.log('Express listening & caring on port ' +
      PORT + '!');
});