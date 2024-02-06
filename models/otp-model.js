const mongoose = require("mongoose");

const otpSchema = mongoose.Schema({
  email: { type: String, required: true },
  otp: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});
// otpSchema.createIndex({ createdAt: 1 }, { expireAfterSeconds: 10 });

const otpModel = mongoose.model("otp", otpSchema);

module.exports = { otpModel };
