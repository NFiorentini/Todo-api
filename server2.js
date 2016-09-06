var express = require('express');
var bodyParser = require('body-parser');
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
  var matchedTodo;

  // Iterate of the todos array defined globally.
  todos.forEach(function (todo) {

    // If the requested id passed into this app.get()
    // matches the id of the current todo in this
    // loop, assign it to matchedTodo.
    if(todoId === (todo.id)) {
      matchedTodo = todo;
    }
  });

  // Pass the matchedTodo to json or send status
  // 404.
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
  var body = req.body;

  // Assign todoNextId to body.id, then increment
  // todoNextId by 1.
  body.id = todoNextId++;

  // Push the todo to the todos array.
  todos.push(body);

  res.json(body);

});



app.listen(PORT, function () {

  console.log('Express listening & caring on port ' +
      PORT + '!');
});