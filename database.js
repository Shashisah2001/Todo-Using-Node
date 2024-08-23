const mongoose = require("mongoose");

mongoose
  .connect("mongodb://localhost:27017/todoApp")
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log("Database Error", err));

const todoSchema = new mongoose.Schema({
  title: String,
  description: String,
  status: { type: String, default: "progress" },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
});

const userSchema = new mongoose.Schema({
  username: String,
  email: { type: String, unique: true },
  password: String,
});

const Todo = mongoose.model("Todo", todoSchema);
const User = mongoose.model("User", userSchema);

module.exports = { Todo, User };
