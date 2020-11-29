const mongoose = require("mongoose");
const passportLOcalMongoose = require("passport-local-mongoose");

let userScheme = new mongoose.Schema({
  name: String,
  email: String,
  password: {
    type: String,
    select: false,
  },
  resePasswordToken: String,
  resePasswordExpires: Date,
});

userScheme.plugin(passportLOcalMongoose, { usernameField: "email" });
module.exports = mongoose.model("walmartdbs", userScheme);
