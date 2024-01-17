const express = require("express");
require("dotenv").config();
const cookieParser = require("cookie-parser");
const cors = require("cors");

const { Connection } = require("./config/db");

const { AuthMiddleware } = require("./middlewares/auth-middleware");

const { userRouter } = require("./routes/user-route");
const { homeRouter } = require("./routes/home-route");

const app = express();

app.use(cors({ credentials: true, origin: "http://localhost:5173" }));

app.use(express.json());
app.use(cookieParser(process.env.cookie_parser_key));

app.use("/user", userRouter);

app.use(AuthMiddleware);
app.use((req, res, next) => {
  if (!Object.hasOwn(req, "userId")) {
    throw new Error("Session time out please login again");
  } else {
    next();
  }
});
app.use("/", homeRouter);

app.listen(process.env.port, async () => {
  try {
    await Connection;

    console.log("Successfully connected to db");
  } catch (err) {
    console.log("Failed to connect to db");
  }
  console.log(`server is running at port ${process.env.port}`);
});
