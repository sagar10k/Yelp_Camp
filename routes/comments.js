var express = require("express");
var router = express.Router( {mergeParams: true} );
var campground = require("../models/campground");
var comment = require("../models/comment");
var middlewareObj = require("../middleware");

//Form of new comment
router.get("/new", middlewareObj.isLoggedIn, function(req, res){
    campground.findById(req.params.id, function(err, camp){
        if(err){
            console.log(err);
        }else{
            res.render("comments/new", {campground: camp});
        }
    });
});

//CREATE : Add new comment to campground/:id
router.post("/", middlewareObj.isLoggedIn, function(req, res){
    campground.findById(req.params.id, function(err, camp){
        if(err){
            console.log(err);
        }else{
           comment.create(req.body.cmmt,function(err, cmmt){
               if(err){
                   req.flash("error", "Something went Wrong");
                   console.log(err);
               }else{
                   //add username and id to comment
                   cmmt.author.id= req.user._id;
                   cmmt.author.username= req.user.username;
                   cmmt.save();
                   camp.comments.push(cmmt);
                   camp.save();
                   req.flash("success", "Successfully Added Your Comment");  
                   res.redirect('/campgrounds/' + camp._id);
               }
           });
        }
    });
    
});

//EDIT: Show Comment Edit Form
router.get("/:comment_id/edit", middlewareObj.isCommentOwned, function(req, res){
    campground.findById(req.params.id, function(err, camp) {
       if(err || !camp){
           req.flash("error", "Campground not found");
           res.redirect("back");
       }
    comment.findById(req.params.comment_id, function(err, foundcmmt){
        if(err){
            res.redirect("back");
        } else{
            res.render("comments/edit", {campground_id : req.params.id, comment: foundcmmt});
        }
        });
    });
});

//UPDATE: Update the Comment
router.put("/:comment_id", middlewareObj.isCommentOwned, function(req, res){
    comment.findByIdAndUpdate(req.params.comment_id, req.body.cmmt, function(err, updatedcmmt){
        if(err || !updatedcmmt){
            req.flash("error", "Comment not found");
            res.redirect("back");
        } else{
            res.redirect("/campgrounds/" + req.params.id);
        }
    });
});

//DESTROY: Delete the Comment
router.delete("/:comment_id", middlewareObj.isCommentOwned, function(req, res){
    comment.findByIdAndRemove(req.params.comment_id, function(err){
        if(err){
            console.log(err);
        } else{
            req.flash("success", "Comment Deleted Successfully");
            res.redirect("/campgrounds/" + req.params.id);
        }
    });
});

module.exports = router;