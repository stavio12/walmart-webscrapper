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



route.get("/product/new", verifyUser, (req, res) => {
  res.render("admin/product");
});

route.get("/dashboard", verifyUser, (req, res) => {
  res.render("admin/dashboard");
});

route.get("/product/search", verifyUser, (req, res) => {
  res.render("admin/search");
});








module.exports = route