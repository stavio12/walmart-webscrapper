const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const flash = require("connect-flash");
const session = require("express-session");
const methodOverride = require("method-override");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;

const app = express();
dotenv.config({ path: "./config.env" });

app.use(express.static("public"));

const navigate = require("./routes/nav");
const userRoutes = require("./routes/userRoutes");
const adminRoutes = require("./routes/adminRoutes");

//Setting up Middlewares

//middle ware for puting and deleting
app.use(methodOverride("_method"));

//Configure mongoose dbs
const User = require("./walmartdbs/userdbs");

mongoose
  .connect(process.env.DATABASE, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
  })
  .then((con) => {
    console.log("Mongod database connected successfully");
  });

//Unhighlet this only when using local dbs else if production use first one

// mongoose
// .connect(process.env.DATABASE_LOCAL, {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
//   useCreateIndex: true,
// })
// .then((con) => {
//   console.log("Mongod database connected successfully");
// });

//Configuring sessions
app.use(
  session({
    secret: "trumu-baku",
    resave: true,
    saveUninitialized: true,
  })
);

//configuring passport
app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy({ usernameField: "email" }, User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

//configuring flash messages and making variables global
app.use(flash());

app.use((req, res, next) => {
  res.locals.success_msg = req.flash("success_msg");
  res.locals.error_msg = req.flash("error_msg");
  res.locals.error = req.flash("error");
  res.locals.currentUser = req.user;

  next();
});

app.use(bodyParser.urlencoded({ extended: true }));
//configuring ejs and routes to pages
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(navigate);
app.use(adminRoutes);
app.use(userRoutes);

app.get("*", (req, res) => {
  res.render("admin/404page");
});

const port = process.env.PORT;
app.listen(port, () => {
  console.log("Sever running on port " + port);
});
