var express = require("express");
var router = express.Router();
var passport = require("passport");
var User = require("../models/user");

//WELCOME PAGE!
router.get("/",function(req,res){
    res.render("landing");
});

//==================================//
//_______AUTHENTICATION ROUTES_____//
//================================//

//register route
router.get("/register", function(req, res){
    res.render("register", { page: 'register' });
});

//register Logic
router.post("/register", function(req, res){
    User.register(new User({ username: req.body.username}), req.body.password, function(err, user){
        if(err){
            req.flash("error", err.message);
            return res.redirect("/register");
        }
        passport.authenticate("local")(req, res, function(){
            req.flash("success", "YelpCamp Welcomes " + user.username);
            res.redirect("/campgrounds");
        });
    });
});

//Login route
router.get("/login", function(req, res){
    res.render("login", { page: 'login' });
});

//Login Logic
router.post("/login", passport.authenticate("local",
    {
        successRedirect: "/campgrounds",
        failureRedirect: "/login",
        successFlash: true,
        failureFlash: true
    }), function(req, res){
});

//Logout
router.get("/logout", function(req, res){
    req.logout();
    req.flash("success", "Logged You Out!");
    res.redirect("/campgrounds");
});

module.exports = router;