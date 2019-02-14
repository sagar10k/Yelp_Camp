//All the Middlewares
var campground= require("../models/campground");
var comment= require("../models/comment");
var middlewareObj = {};

middlewareObj.isOwnedCampground= function(req, res, next){
    if(req.isAuthenticated()){
            campground.findById(req.params.id, function(err, camp){
                if(err || !camp){
                    req.flash("error", "OOPS! Campground not Found")
                    res.redirect("back");
                } else{
                    if(camp.author.id.equals(req.user._id)){
                        next();  
                    } else{
                        req.flash("error", "You Dont have Permission to do that");
                        res.redirect("back");
                    }
                }
            });
        } else{
            req.flash("error", "You Need to be logged in to do that");
            res.redirect("back");
        }
};

middlewareObj.isCommentOwned= function(req, res, next){
        if(req.isAuthenticated()){
            comment.findById(req.params.comment_id, function(err, foundcmmt){
                if(err || !foundcmmt){
                    req.flash("error", "Comment not found");
                    res.redirect("back");
                } else{
                    if(foundcmmt.author.id.equals(req.user._id)){
                        next();
                    } else{
                        req.flash("error", "You Dont have permission to do that");
                        res.redirect("back");
                    }
                }
            });
        } else{
            req.flash("error", "You Need to be loggedin to do that");
            res.redirect("back");
        }
};

middlewareObj.isLoggedIn= function(req, res, next){
    if(req.isAuthenticated()){
        return next();
    }
    req.flash("error", "You Need to be logged in to do that");
    res.redirect("/login");
};


module.exports= middlewareObj;