// Dependencies
var express = require("express");
var bodyParser = require("body-parser");
var mongoose = require("mongoose");

// Requiring our Article models
var Article = require("./models/Article.js");
var Comment = require("./models/Comment.js");
// Our scraping tools
var request = require("request");
var cheerio = require("cheerio");
// Set mongoose to leverage built in JavaScript ES6 Promises
mongoose.Promise = Promise;

var port=process.env.PORT || 3000

// Initialize Express
var app = express();

//Use Middleware (body parser) to 
app.use(bodyParser.urlencoded({
  extended: false
}));

// Make public a static dir
app.use(express.static("public"));

// Hook mongoose configuration to the db variable
mongoose.connect("mongodb://heroku_dkx5lg2z:gk5id96ehc8v3huf32e08j6e4k@ds113063.mlab.com:13063/heroku_dkx5lg2z");
var db = mongoose.connection;
db.on("error", function(error) {
  console.log("Database Error:", error);
});
 db.once("open", function() {
  console.log("Mongoose Connection Successful");
 });
// Main route (simple message)
//app.get("/", function(req, res) {
//  res.send("Hey, good looking, what's scraping?");
//});



// Scrape data from one site and place it into the mongodb db
app.get("/scrape", function(req, res) {
  // Make a request for the news section of ycombinator
  request("https://speckyboy.com/", function(error, response, html) {
    // Load the html body from request into cheerio
    var $ = cheerio.load(html);
    // For each element with a "title" class
    $("h2.post-title").each(function(i, element) {
      // Save the text and href of each link enclosed in the current element
      var result = {};
      result.title = $(this).children("a").attr("title");
      result.link = $(this).children("a").attr("href");

      console.log(result.title);
      console.log(result.link);

      var entry = new Article(result);

      //Save the entry to the DB
      entry.save(function(err, doc) {
        if (err) {
          console.log(err);
        }
        else {
          console.log(doc);
        }
      });

    });
  });

  // Send a "Scrape Complete" message to the browser
  res.send("Scrape Complete");
});

//ROUTES

// This will get the articles we scraped from the mongoDB
app.get("/articles", function(req, res) {
  // Grab every doc in the Articles array
  Article.find({}, function(error, doc) {
    // Log any errors
    if (error) {
      console.log(error);
    }
    // Or send the doc to the browser as a json object
    else {
      res.json(doc);
    }
  });
});
// Grab an article by it's ObjectId
app.get("/articles/:id", function(req, res) {
  // Using the id passed in the id parameter, prepare a query that finds the matching one in our db...
  Article.findOne({ "_id": req.params.id })
  // ..and populate all of the notes associated with it
  .populate("comment")
  // now, execute our query
  .exec(function(error, doc) {
    // Log any errors
    if (error) {
      console.log(error);
    }
    // Otherwise, send the doc to the browser as a json object
    else {
      res.json(doc);
    }
  });
});
// Create a new note or replace an existing note
app.post("/articles/:id", function(req, res) {
  // Create a new note and pass the req.body to the entry
  var newComment = new Comment(req.body);

  // And save the new note the db
  newComment.save(function(error, doc) {
    // Log any errors
    if (error) {
      console.log(error);
    }
    // Otherwise
    else {
      // Use the article id to find and update it's note
      Article.findOneAndUpdate({ "_id": req.params.id }, { "comment": doc._id })
      // Execute the above query
      .exec(function(err, doc) {
        // Log any errors
        if (err) {
          console.log(err);
        }
        else {
          // Or send the document to the browser
          res.send(doc);
        }
      });
    }
  });
});

// Listen on port 3000
app.listen(port, function() {
  console.log("App running on port 3000!");
});