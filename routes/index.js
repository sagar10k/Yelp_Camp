var express = require("express");
var router = express.Router();
var passport = require("passport");
var User = require("../models/user");
var Campground = require("../models/campground");
var nodemailer= require("nodemailer");
var async= require("async");
var crypto= require("crypto");

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
    var newUser = new User({
        username:    req.body.username, 
        firstName:  req.body.firstName,
        lastName:   req.body.lastName,
        email:      req.body.email,
        avatar:     req.body.avatar
    });
    
    User.register(newUser, req.body.password, function(err, user){
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

//User Profile
router.get("/user/:id", function(req, res){
    User.findById(req.params.id, function(err, foundUser){
        if(err){
            req.flash("error", "Something went wrong!");
            return res.redirect("/");
        }
        Campground.find().where("author.id").equals(foundUser._id).exec(function(err, foundCamps){
           if(err){
             req.flash("error", "Something went wrong!");
             return res.redirect("/"); 
           }
            res.render("users/show", {user: foundUser, campgrounds: foundCamps});
        });
    });
});

//forgot password
router.get("/forgot", function(req, res) {
   res.render("users/forgot"); 
});

router.post("/forgot", function(req, res, next){
    async.waterfall([
        function(done){
            crypto.randomBytes(20,function(err, buff){
            var token= buff.toString('hex');
            done(err, token);
            });
        },
        function(token, done){
            console.log(req.body.email);
            User.findOne({email: req.body.email }, function(err, foundUser){
                if(!foundUser || err){
                    req.flash("error", "no user account with given email address exists");
                    return res.redirect("/forgot");
                }
                foundUser.resetPasswordToken = token;
                foundUser.resetPasswordExpires = Date.now() + 3600000; 
                
                foundUser.save(function(err){
                    done(err, token, foundUser);
                });
            });   
        },
        function( token, foundUser, done){
            var smtpTransport= nodemailer.createTransport({
                service:  'Gmail',
                auth: {
                    user: 'sagar104323@gmail.com',
                    pass: process.env.GMAILPW
                }
            });
            var mailOptions= {
                to: foundUser.email,
                from: '"yelp_team "<sagar104323@gmail.com>',
                subject: "Yelpcamp Password Reset Request",
                text: "You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n" +
                      "Please click on the following link, or paste this into your browser to complete the process:\n\n" +
                      "http://" + req.headers.host + "/reset/" + token + "\n\n" +
                      "If you did not request this, please ignore this email and your password will remain unchanged.\n"
            };
            smtpTransport.sendMail(mailOptions, function(err){
                req.flash("success", "An e-mail has been sent to " + foundUser.email + "with further instruction to follow.");
                done(err, 'done');
            });
        }
    ], function(err) {
        if (err) return next(err);
        res.redirect("/forgot");
    });
});

//password reset route

router.get("/reset/:token", function(req, res){
    User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now()} }, function(err, foundUser){
        if(!foundUser){
            req.flash("error", "Password request token is invalid or has expired ");
            return res.redirect("/forgot");
        }
        res.render("users/reset", { token: req.params.token });
    });
});

router.post("/reset/:token", function(req, res){
    async.waterfall([
        function(done){
            User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now()} }, function(err, foundUser){
                if(!foundUser){
                    req.flash("error", "Password request token is invalid or has expired ");
                    return res.redirect("/forgot");
                }
                if( req.body.password === req.body.confirm){
                   foundUser.setPassword(req.body.password, function(err){
                       if(err) throw err;
                       foundUser.resetPasswordToken= undefined;
                       foundUser.resetPasswordExpires= undefined;
                    foundUser.save(function(err){
                        if(err) { 
                            req.flash("error", "Password reset failed");    
                        }
                        req.logIn(foundUser, function(err){
                           if(err){ 
                               req.flash("error", "Unable to login please login again"); 
                            }
                            done(err, foundUser);
                        });
                    });    
                   });
                } else{
                    req.flash("error", "password credentials enter dont match");
                    res.redirect("back");
                }
            });
        },
        function(foundUser, done){
            var smtpTransport= nodemailer.createTransport({
                service:  'Gmail',
                auth: {
                    user: 'sagar104323@gmail.com',
                    pass: process.env.GMAILPW
                }
            });
            var mailOptions= {
                to: foundUser.email,
                from: '"yelp_team "<sagar104323@gmail.com>',
                subject: "You Password for your Yelpcamp acoount has been changed",
                text: 'Hello, \n\n' +
                    'This is a confirmation that the password for your account ' +foundUser.email + 'has just been changed \n'
            };
            smtpTransport.sendMail(mailOptions, function(err){
                req.flash("success", "Success!  Your password has been changed successfully. ");
                done(err);
            });
        }
    ], function(err){
        if(err){
            req.flash("Error", "Password reset failed");
        }
        res.redirect("/campgrounds");
    });
});


module.exports = router;