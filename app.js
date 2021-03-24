const express = require("express");
require("express-async-errors");
const app = express();
const mongoose = require("mongoose");
const config = require("./utils/config");
const middleware = require("./utils/middleware");
const authRouter = require("./controllers/auth");
const usersRouter = require("./controllers/users");
const postsRouter = require("./controllers/posts");

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
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Routes
app.use("/api/auth", authRouter);
app.use("/api/users", usersRouter);
app.use("/api/posts", postsRouter);

// Error Handling Middleware
app.use(middleware.unknownEndpoint);
app.use(middleware.errorHandler);

module.exports = app;
