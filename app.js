var express= require("express");
var app= express();

require('dotenv').config();

app.set("view engine","ejs");

var bodyParser= require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

var methodOverride= require("method-override");
app.use(methodOverride("_method"));

var flash = require("connect-flash");
app.use(flash());

app.locals.moment = require('moment');

var mongoose=require("mongoose");
var url= process.env.DATABASEURL || "mongodb://localhost/yelp_camp_v13MAP";
mongoose.connect(url);

var User= require("./models/user");
app.use(require("express-session")({
    secret:"I am the One Who Knocks!",
    resave:false,
    saveUninitialized:false
}));

var passport= require("passport");
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

var LocalStrategy= require("passport-local");
passport.use(new LocalStrategy(User.authenticate()));

app.use(function(req, res, next){
   res.locals.currentUser= req.user;
   res.locals.success= req.flash("success");
   res.locals.error= req.flash("error");
   next();
});

// var seedDB= require("./seeds");

app.use(express.static(__dirname + "/public/"));

// seedDB();

var campgroundRoutes = require("./routes/campgrounds"),
    commentRoutes = require("./routes/comments"),
    indexRoutes = require("./routes/index");

//requiring Routes
app.use("/campgrounds",campgroundRoutes);
app.use("/campgrounds/:id/comments/",commentRoutes);
app.use("/",indexRoutes);    

//Listening to all ROUTES Created
app.listen(process.env.PORT,process.env.IP,function(){
    console.log("YELPCAMP SERVER HAS STARTED..!");
});