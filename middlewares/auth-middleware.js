const jwt = require("jsonwebtoken");
require("dotenv").config();

const AuthMiddleware = (req, res, next) => {
  const cookies = req.signedCookies;
  if (Object.hasOwn(cookies, "token")) {
    jwt.verify(cookies.token, process.env.token_secret, (err, decoded) => {
      if (err) throw new Error(err);
      if (decoded) {
        req.userId = decoded.userId;
        next();
      } else {
        throw new Error("something went wrong");
      }
    });
  } else if (Object.hasOwn(cookies, "refresh_token")) {
    jwt.verify(cookies.refresh_token, process.env.refresh_token_secret, (err, decoded) => {
      if (err) throw new Error(err);
      if (decoded) {
        req.userId = decoded.userId;

        const new_token = jwt.sign({ userId: decoded.userId }, process.env.token_secret);
        res.cookie("token", new_token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000, signed: true });
        next();
      } else {
        throw new Error("something went wrong");
      }
    });
  } else {
    next();
  }
};

module.exports = { AuthMiddleware };
