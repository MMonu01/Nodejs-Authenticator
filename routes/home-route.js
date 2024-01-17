const express = require("express");

const homeRouter = express();

homeRouter.get("/home", (req, res, next) => {
  res.send({ data: "HOme page" });
});

module.exports = { homeRouter };
