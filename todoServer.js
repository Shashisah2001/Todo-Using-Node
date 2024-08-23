const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const { Todo, User } = require("./database");

const app = express();
const JWT_SECRET = "$$12345$$";

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());

mongoose.connect("mongodb://localhost:27017/todoApp");

// Middleware to authenticate JWT token
function authenticateToken(req, res, next) {
  const token = req.header("Authorization")?.replace("Bearer ", "");
  if (!token) return res.status(403).json({ message: "Token required" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid token" });
  }
  console.log(token); // to debug
}

// Registration route
app.post("/register", async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, email, password: hashedPassword });

    await newUser.save();
    res.status(201).json({ message: "User created successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Login route
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ message: "Invalid email or password" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid email or password" });

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, {
      expiresIn: "1h",
    });
    console.log(token); // used log for debuging token as i'm receiving alot of error.

    res.json({ token });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Todo CRUD operations

// Get todos
app.get("/todo", authenticateToken, async (req, res) => {
  try {
    const todos = await Todo.find({ userId: req.user });
    res.json(todos);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch todos" });
  }
});

// Search todos
app.get("/todo/search", authenticateToken, async (req, res) => {
  const query = req.query.q;

  if (!query) {
    return res.status(400).json({ message: "Query parameter is required" });
  }

  try {
    const tasks = await Todo.find({
      userId: req.user,
      $or: [
        { title: { $regex: query, $options: "i" } },
        { description: { $regex: query, $options: "i" } },
      ],
    });
    res.json(tasks);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error searching tasks", error: err.message });
  }
});

// Add a new todo
app.post("/todo", authenticateToken, async (req, res) => {
  try {
    const { title, description, status } = req.body;
    const newTodo = new Todo({
      title,
      description,
      status: status || "progress",
      userId: req.user,
    });
    await newTodo.save();
    res.json(newTodo);
  } catch (err) {
    res.status(500).json({ error: "Failed to add todo" });
  }
});

// Update a todo
app.put("/todo/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid ID format" });
    }

    const updatedTodo = await Todo.findByIdAndUpdate(
      id,
      { title, description, status },
      { new: true }
    );

    if (updatedTodo) {
      res.json(updatedTodo);
    } else {
      res.status(404).json({ error: "Todo not found" });
    }
  } catch (err) {
    console.error("Error updating todo:", err);
    res.status(500).json({ error: "Failed to update todo" });
  }
});

// Delete a todo
app.delete("/todo/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const deletedTodo = await Todo.findByIdAndDelete(id);
    if (deletedTodo) {
      res.json(deletedTodo);
    } else {
      res.status(404).json({ error: "Todo not found" });
    }
  } catch (err) {
    res.status(500).json({ error: "Failed to delete todo" });
  }
});

// Serve static files
app.use(express.static(path.join(__dirname, "../Todo-frontend")));

// Fallback for SPA
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../Todo-frontend/index.html"));
});

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
