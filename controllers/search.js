const searchRouter = require("express").Router();
const User = require("../models/user");
const { createSearchOptions } = require("../utils/searchOptions");

// search for users by name or username
searchRouter.get("/users", async (req, res) => {
  const searchOptions = createSearchOptions(req.query);

  if (!searchOptions.length) {
    return res.status(400).json({ error: "Search options were not given" });
  }

  const userProfiles = await User.find(
    {
      $or: searchOptions,
    },
    "name username profilePic"
  );

  res.json({ results: userProfiles });
});

module.exports = searchRouter;
