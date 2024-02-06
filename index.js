const express = require("express");
require("dotenv").config();
const cookieParser = require("cookie-parser");
const cors = require("cors");
const { SendMobileSms } = require("./utils/send-mobile-sms");

const { jwtDecode } = require("jwt-decode");

const { Connection } = require("./config/db");

const { AuthMiddleware } = require("./middlewares/auth-middleware");

const { userRouter } = require("./routes/user-route");
const { homeRouter } = require("./routes/home-route");

const app = express();

app.use(cors({ credentials: true, origin: "http://localhost:9001" }));

app.use(express.json());
app.use(cookieParser(process.env.cookie_parser_key));

// SendMobileSms();

console.log("decode", jwtDecode("s:eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2NWE0MmNkZTVjZTIwZjVlNGQxZjYzYzUiLCJpYXQiOjE3MDcxNTY0MjcsImV4cCI6MTcwNzc2MTIyN30.MDLoV2GV3paIEM59S6rQDj5c7VvSYnPjZymJq9ykePc.bDEysIxDaNlMsPi7QESr6uznpC3PhUqBrh9ahZZMdAw"));
console.log("not decoded", jwtDecode("s:eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2NWE0MmNkZTVjZTIwZjVlNGQxZjYzYzUiLCJpYXQiOjE3MDcyMzQ1MzIsImV4cCI6MTcwNzgzOTMzMn0.ZSjaFtGsyQ_JPXSrgPOjoPjLXW1EUH0ABhCeZaAfukc.ld8o694r9kGLV6Rg03mQsDD3ZlY3MO8ZxHDnVPcXeAs"));

app.use("/user", userRouter);

app.use(AuthMiddleware);
app.use((req, res, next) => {
  if (!Object.hasOwn(req, "userId")) {
    next("Session time out please login again");
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
