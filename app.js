const express = require("express");
require("express-async-errors");
const app = express();
const mongoose = require("mongoose");
const cors = require("cors");
const config = require("./utils/config");
const middleware = require("./utils/middleware");
const authRouter = require("./controllers/auth");
const usersRouter = require("./controllers/users");
const postsRouter = require("./controllers/posts");
const commentsRouter = require("./controllers/comments");
const searchRouter = require("./controllers/search");

// Connect to DB
mongoose
  .connect(config.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
    useCreateIndex: true,
  })
  .then(() => console.log("connected to Mongo"))
  .catch((error) => console.error("error connecting to Mongo", error.message));

// Middleware
app.use(cors());
app.use(express.json({ limit: "30MB" }));
app.use(express.urlencoded({ limit: "30MB", extended: true }));

// Routes
app.use("/api/auth", authRouter);
app.use("/api/posts", postsRouter);
app.use("/api/users", usersRouter);
app.use("/api/comments", commentsRouter);
app.use("/api/search", searchRouter);
app.use("/", (req, res) => {
  res.send("IGL-server");
});

// Error Handling Middleware
app.use(middleware.unknownEndpoint);
app.use(middleware.errorHandler);

module.exports = app;
