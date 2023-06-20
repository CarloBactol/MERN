require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const toastr =  require("toastr");
const md5 =  require("md5");
const session =  require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate')



// const toastr = require("toastr");
const app = express();
app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"))

// Session
app.use(session({
  secret: "my secret",
  resave: false,
  saveUninitialized: false
}))
app.use(passport.initialize());
app.use(passport.session());


// Connect to the MongoDB database
mongoose.connect(
  "mongodb+srv://carlo:test123@cluster0.nbufagg.mongodb.net/mern",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
);



// Define a schema for the collection
const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  googleId: String,
  secret: String
});

// Add plugin 
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

// Create a model based on the schema
const User = mongoose.model("User", userSchema);

// passport create strategy 
passport.use(User.createStrategy());

// passport serialized and deserialize
// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser());

passport.serializeUser(function(user, done) {
  done(null, user);
  });
  
  passport.deserializeUser(function(user, done) {
  done(null, user);
  });


// Google Auth Strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: "https://carlobactol-redesigned-space-guide-6xvvxp54v5c475v-3000.preview.app.github.dev/auth/google/secret",
  userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
},
function(accessToken, refreshToken, profile, cb) {
  User.findOrCreate({ username: profile.displayName,  googleId: profile.id }, function (err, user) {
    return cb(err, user);
  });
}
));

// Google Auth
app.get("/auth/google",
  passport.authenticate("google", { scope: ["profile"] }));

app.get("/auth/google/secret", 
  passport.authenticate("google", { failureRedirect: "/login" }),
  function(req, res) {
    // Successful authentication, redirect secret.
    res.redirect("/secret");
  });

  // Submit
  app.get("/submit",  (req, res) => {
    try {
      if(req.isAuthenticated()){
       res.render("submit");
      }else{
       res.redirect("/login");
      }
     } catch (error) {
       res.status(500).json({ error: "An error occurred" });
     }
  });


   // Submit
   app.post("/submit", async (req, res) => {
    try {
      console.log(req.user.id);
      const isUser = await User.findOne({id: req.user.id}).exec()
      if(isUser){
        console.log("Yes");
        isUser.secret = req.body.secret
        await isUser.save();
        res.redirect("/secret");
      }else{
        console.log("Not Authorize");
        res.render("login")
      }
    } catch (error) {
      console.log(error);
    }
  });


// Home
app.get("/", async (req, res) => {
  try {
    // Use the find() method with async and await
    const users = await User.find();

    // res.json(users);
    res.render("home");
  } catch (error) {
    res.status(500).json({ error: "An error occurred" });
  }
});

app.get("/secret", async (req, res) => {
  try {
   if(req.isAuthenticated()){
    res.render("secret");
   }else{
    res.redirect("/login");
   }
  } catch (error) {
    res.status(500).json({ error: "An error occurred" });
  }
});

// Register
app.get("/register", async (req, res) => {
  try {
    res.render("register");
  } catch (error) {
    res.status(500).json({ error: "An error occurred" });
  }
});

app.post("/register", async (req, res) => {
  // try {
  //   const user = new User({
  //     email: req.body.username,
  //     password: md5(req.body.password),
  //   });
  //   await user.save();
  //   res.render("secret");
  // } catch (error) {
  //   res.status(500).json({ error: "An error occurred" });
  // }

  User.register({username: req.body.username, active: false}, req.body.password, function(err, user) {
    if (err) { 
      console.log(err);
      console.log("Already Register Account");
      res.redirect("login");
     }else{
      passport.authenticate("local")(req, res, function(){
        console.log("Yes");
        res.redirect("/secret");
      });
     }
  });

});




// ========================== Login ======================
app.get("/login", async (req, res) => {
  try {
    res.render("login");
  } catch (error) {
    res.status(500).json({ error: "An error occurred" });
  }
});

app.post("/login",  (req, res) => {
 
  //   const username = req.body.username;
  //   const password = md5(req.body.password);

  // try {
  //  const isUser = await User.findOne({email: username, password: password}).exec()
  //  if(isUser){
  //   console.log("Yes");
  //   res.render("secret");
  //  }else{
  //   console.log("Not Authorize");
  //   res.render("login")
  //  }
  // } catch (error) {
  //   console.log(error);
  // }

  const users = new User({
    email: req.body.username,
    password: req.body.password,
  });

  req.login(users, function(err){
    if(err){
      console.log(err);
      res.redirect("/login");
    }else{
      passport.authenticate("local")(req, res, function(){
        res.redirect("/secret");
      });
    }
  });

});


// Logout
app.get("/logout", function(req, res, next) {
  req.logout(function(err) {
    if (err) { return next(err); }
    res.redirect('/login');
  });
});




// Start the server
app.listen(3000, () => {
  console.log("Server is running on port 3000");
});

