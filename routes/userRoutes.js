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

route.get("/signup", verifyUser, (req, res) => {
  res.render("admin/register");
});

route.get("/users/all", verifyUser, (req, res) => {
  User.find({})
    .then((user) => {
      res.render("users/viewall", { user: user });
    })
    .catch((err) => {
      req.flash("error_msg", "ERROR: " + err);
      console.log(err);
    });
});

route.get("/edit/:id", verifyUser, (req, res) => {
  let id = { _id: req.params.id };

  User.findOne(id)
    .then((user) => {
      res.render("users/update", { user: user });
    })
    .catch((err) => {
      req.flash("error_msg", "ERROR: " + err);
      res.redirect("/users/all");
      console.log(err);
    });
});

route.get("/logout", verifyUser, (req, res) => {
  req.logOut();
  req.flash("success_msg", "Bye!,    See You Soon");
  res.redirect("/");
});

route.get("/reset", (req, res) => {
  res.render("users/reset");
});

//All Post Routes

// registering user
route.post("/signup", (req, res) => {
  let { username, email, password } = req.body;

  let userData = {
    name: username,
    email: email,
  };

  User.register(userData, password, (err, user) => {
    if (err) {
      console.log(err);
      req.flash("error_msg", "ERROR" + err);
      res.redirect("/");
    }

    //After creating send email to user
    let smtpTransport = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.GMAIL_EMAIL,
        pass: process.env.GMAIL_PASSWORD,
      },
    });

    let mailOptions = {
      to: req.body.email,
      from: "Kobla Stavio koblastavio@gmail.com",
      subject: "Walmart Webscrapper Account Created",
      text: "Hi " + req.body.username + ", you have been added as an account holder to Walmart Webscrapper",
    };

    smtpTransport.sendMail(mailOptions, (err) => {
      req.flash("success_msg", "Account Created Successfully");
      res.redirect("/signup");
    });
  });
});

route.post(
  "/",
  passport.authenticate("local", {
    successRedirect: "/dashboard",
    failureRedirect: "/",
    failureFlash: "Invalid email or password. Try Again!",
  })
);

route.post("/reset", (req, res, next) => {
  let recoveryPassword = "";
  async.waterfall(
    //generate a random token for changing paassword

    [
      (done) => {
        crypto.randomBytes(20, (err, buf) => {
          let token = buf.toString("hex");
          done(err, token);
        });
      },

      //find user by email else alert user
      (token, done) => {
        User.findOne({ email: req.body.email }).then((user) => {
          if (!user) {
            req.flash("error_msg", "No user exist with email");
            return res.redirect("/reset");
          }

          //if user exist send token to user

          user.resetPasswordToken = token;
          user.resetPasswordExpires = Date.now() + 1800000;

          user.save((err) => {
            done(err, token, user);
          });
        });
      },

      //send token to user via email if everything seems okay
      (token, user) => {
        let smtpTransport = nodemailer.createTransport({
          service: "Gmail",
          auth: {
            user: process.env.GMAIL_EMAIL,
            pass: process.env.GMAIL_PASSWORD,
          },
        });
        let mailoptions = {
          to: user.email,
          from: "Kobla Stavio koblastavio@gmail.com",
          subject: "Recovery Email From Innit Crew",
          text: "Please click the following link to recover your password: \n\n\n\n" + "http://" + req.headers.host + "/reset/" + token + "\n\n\n\n" + "If you did not request this, please ignore this email",
        };

        smtpTransport.sendMail(mailoptions, (err) => {
          req.flash("success_msg", "Please check your email with further instructions.");
          res.redirect("/");
        });
      },
    ]
  );
});

//All DELETE routes

route.delete("/delete/:id", (req, res) => {
  let id = { _id: req.params.id };
  User.deleteOne(id)
    .then((user) => {
      req.flash("success_msg", "Employee deleted Successfully");
      res.redirect("/users/all");
    })
    .catch((err) => {
      req.flash("error_msg", "ERROR: " + err);
    });
});

//All PUT Routes

route.put("/edit/:id", (req, res) => {
  let id = { _id: req.params.id };

  console.log(req.body.username, req.body.email);
  User.updateOne(id, {
    $set: {
      name: req.body.username,
      email: req.body.email,
    },
  })
    .then((user) => {
      req.flash("success_msg", "User updated sucessfully.");
      res.redirect("/users/all");
    })
    .catch((err) => {
      req.flash("error_msg", "ERROR: " + err);
      res.redirect("/users/all");
    });
});

module.exports = route;
