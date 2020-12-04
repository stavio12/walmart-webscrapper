const express = require("express");
const route = express.Router();
const passport = require("passport");
const crypto = require("crypto");
const async = require("async");
const nodemailer = require("nodemailer");

//requring user model from dbs
const User = require("../walmartdbs/userdbs");

// check whether a user is authenticated
function verifyUser(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }

  req.flash("error_msg", "Please Login first to access this page");
  res.redirect("/");
}

//ALl Get Routes





module.exports = route;
