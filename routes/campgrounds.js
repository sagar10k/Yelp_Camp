var express = require("express");
var router = express.Router();
var campground = require("../models/campground");
var middlewareObj = require("../middleware");

//INDEX : Display all campground from DB
router.get("/",function(req,res){
    campground.find({},function(err,allcamp){
        if(err){
            console.log(err);
        }else{
            res.render("./campgrounds/index", {campground:allcamp, page: "campgrounds"});
        }
    });
});

//CREATE : Add new campground to DB
router.post("/", middlewareObj.isLoggedIn,function(req,res){
    var name=req.body.name;
    var price=req.body.price;
    var image=req.body.img;
    var desc=req.body.description;
    var author= {
        id: req.user._id,
        username: req.user.username
    };
    var  newcamp={
        name: name, 
        price: price,
        image: image,
        description: desc,
        author
    };
    campground.create(newcamp,function(err,camp){
        if(err){
            console.log(err);
        }else{
            res.redirect("/campgrounds");
        }
    });
});

//Form to get new campground
router.get("/form", middlewareObj.isLoggedIn,function(req,res){
    res.render("./campgrounds/new");
});

//SHOW : Show Info of particular selected campground
router.get("/:id",function(req,res){
    campground.findById(req.params.id).populate("comments").exec(function(err,camp){
        if(err || !camp){
            req.flash("error", "Campground not found");
            res.redirect("back");
        }
        else{
            res.render("./campgrounds/show",{campground: camp});
        }
    });
});

//EDIT : Route to Edit form
router.get("/:id/edit", middlewareObj.isOwnedCampground,function(req, res){
    campground.findById(req.params.id, function(err, camp){
    res.render("campgrounds/edit", {campground: camp});
    });
});

//UPDATE: Update the campground & save
router.put("/:id", middlewareObj.isOwnedCampground, function(req, res){
    campground.findByIdAndUpdate(req.params.id, req.body.camp, function(err, Updatedcamp){
        if(err){
            res.redirect("back");
        } else{
            res.redirect("/campgrounds/" + req.params.id);
        }
    });
});

//DESTROY: Delete Campground
router.delete("/:id", middlewareObj.isOwnedCampground, function(req, res){
    campground.findByIdAndRemove(req.params.id, function(err){
        if(err){
            res.redirect("/campgrounds");
        } else
            res.redirect("/campgrounds");
    });
});

module.exports= router;