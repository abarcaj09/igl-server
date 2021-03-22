const express = require("express");
require("express-async-errors");
const app = express();
const mongoose = require("mongoose");
const config = require("./utils/config");

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

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

app.get("/", (req, res) => {
  res.json({ message: "igl server" });
});

module.exports = app;
