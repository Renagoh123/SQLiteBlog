/**
* index.js
* This is your main app entry point
*/

// Set up express, bodyparser and EJS
const express = require('express');
const app = express();
const port = 3000;
var bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs'); // set the app to use ejs for rendering
app.use(express.static(__dirname + '/public')); // set location of static files
app.use('/node_modules', express.static(__dirname + '/node_modules/'));


// Set up SQLite
// Items in the global namespace are accessible throught out the node application
const sqlite3 = require('sqlite3').verbose();
global.db = new sqlite3.Database('./database.db',function(err){
    if(err){
        console.error(err);
        process.exit(1); // bail out we can't connect to the DB
    } else {
        console.log("Database connected");
        global.db.run("PRAGMA foreign_keys=ON"); // tell SQLite to pay attention to foreign key constraints
    }
});

/** 
// GET route for the main home page
// This route simply renders the main entry point of the application.
// Inputs: None
// Outputs: Renders the 'main.ejs' view to the client
*/
app.get('/', function(req, res){
    res.render("main.ejs");
});

/**
// GET route for the user registration page
// This route renders a form that allows a new user to register.
// Inputs: None
// Outputs: Renders the 'add-user.ejs' view to the client
*/
app.get('/register', function(req, res){
    res.render("add-user.ejs");
});

/**
// POST route to add a new user
// This route receives form data and inserts a new user into the database.
// Inputs: user_name from the request body
// Outputs: Redirects to the 'Author Home Page' on success or passes the error to the error handler
*/
app.post("/add-user", function(req, res, next) {
    let query = "INSERT INTO users (user_name) VALUES( ? );";
    let query_parameters = req.body.user_name;
    
    // Execute the query with the provided user name
    global.db.run(query, [query_parameters], function (err) {
            if (err) {
                next(err); //send the error on to the error handler
            } else {
                // Store the last inserted ID (from the SQL operation) in a global variable for further operation
                global.userID = this.lastID 
                // Redirect to the author's homepage after successful registration
                res.redirect("/author/homepage");
            }
        }
    );
});

// Add all the route handlers in usersRoutes to the app under the path /users
const { router: authorRoutes } = require('./routes/author');
app.use('/author', authorRoutes);

const readerRoutes = require('./routes/reader');
app.use('/reader', readerRoutes);


// Make the web application listen for HTTP requests
app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})

