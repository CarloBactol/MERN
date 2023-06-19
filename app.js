const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const toastr =  require("toastr");
const md5 =  require("md5");
const session =  require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");



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
});

// Add plugin 
userSchema.plugin(passportLocalMongoose);

// Create a model based on the schema
const User = mongoose.model("User", userSchema);

// passport create strategy 
passport.use(User.createStrategy());

// passport serialized and deserialize
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

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
      console.log("Err");
      // res.redirect("/login");
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
    }else{
      passport.authenticate("local")(req, res, function(){
        res.redirect("/secret");
      });
    }
  });

});


// Start the server
app.listen(3000, () => {
  console.log("Server is running on port 3000");
});

