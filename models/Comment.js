// Require mongoose
var mongoose = require("mongoose");
// Create Schema class
var Schema = mongoose.Schema;

// Create article schema
var CommentSchema = new Schema({
  // title is a required string
  title: {
    type: String,
    required: true
  },
  // link is a required string
  link: {
    type: String,
    required: true
  },
  // This only saves one note's ObjectId, ref refers to the Note model
  note: {
    type: Schema.Types.ObjectId,
    ref: "Comment"
  }
});

// Create the Comment model with the CommentSchema
var Comment = mongoose.model("Comment", CommentSchema);

// Export the model
module.exports = Comment;