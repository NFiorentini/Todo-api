// db.js loads all of the modules into sequelize &
// returns the database connection to server.js.

let Sequelize = require('sequelize');

// process.env is an object with key/value pairs.
// Heroku sets NODE_ENV.
let env = process.env.NODE_ENV || 'development';


// The value of sequelize depends upon the
// if/else below.
let sequelize;


// True if running on Heroku.
if(env === 'production') {

  // For connecting to our postgres db on Heroku.
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres'
  });

} else {
  sequelize = new Sequelize(undefined, undefined,
      undefined, {

    'dialect': 'sqlite',

    // __dirname is variable provided by Nodejs
    // representing the path from harddrive to the
    // current working directory.
    'storage': __dirname + '/data/dev-todo-api.sqlite'
  });
}


let db = {};


// Load sequelize models.
db.todo = sequelize.import(__dirname + '/models/todo.js');
db.user = sequelize.import(__dirname + '/models/user.js');


// The sequelize instance.
db.sequelize = sequelize;


// The Sequelize library.
db.Sequelize = Sequelize;


// Export the db object
module.exports = db;