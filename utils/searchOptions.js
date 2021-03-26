const createSearchOptions = (query) => {
  let options = [];
  for (const [key, value] of Object.entries(query)) {
    options.push({ [key]: { $regex: value, $options: "i" } });
  }

  return options;
};

module.exports = { createSearchOptions };
