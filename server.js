var express = require('express');
var app = express();
var PORT = process.env.PORT  || 3000;


// Temporary until we use a real db.
// Each todo is the model.
var todos =[{
  id: 1,
  description: 'Meet mom for lunch',
  completed: false
}, {
  id: 2,
  description: 'Go to market',
  completed: false
}, {
  id: 3,
  description: 'Win Heisman Trophy',
  completed: true
}];


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



app.listen(PORT, function () {

  console.log('Express listening & caring on port ' +
      PORT + '!');
});