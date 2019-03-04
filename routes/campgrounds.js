var express = require("express");
var router = express.Router();
var campground = require("../models/campground");
var middlewareObj = require("../middleware");
var mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");
var geocodingClient = mbxGeocoding({ accessToken: process.env.MAPBOX_TOKEN });

//multer configuration
var multer= require("multer");
var storage = multer.diskStorage({
  filename: function(req, file, callback) {
    callback(null, Date.now() + file.originalname);
  }
});
var imageFilter = function (req, file, cb) {
    // accept image files only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};
var upload = multer({ storage: storage, fileFilter: imageFilter});

//Cloudinary configuration
var cloudinary = require('cloudinary');
cloudinary.config({ 
  cloud_name: 'sagar10k', 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// console.log("cloudinary api_key: ",process.env.CLOUDINARY_API_KEY);
// console.log("cloudinary api_key: ",process.env.CLOUDINARY_API_SECRET);

//INDEX : Display all campground from DB
router.get("/",function(req,res){
    var noMatch= null;
    if(req.query.search){
         const regex = new RegExp(escapeRegex(req.query.search), 'gi');
         campground.find({ $or:[
                { name: regex }, 
                // { location: regex }, 
                { "author.username":regex }
            ]},function(err,allcamp){
            if(err){
                console.log(err);
            }else{
                if(allcamp.length == 0) {
                    noMatch="Sorry no Campground match that query, please try again.";
                }
                res.render("./campgrounds/index", {campground:allcamp, page: "campgrounds", noMatch: noMatch });
            }
        }); 
    }else{
        campground.find({},function(err,allcamp){
            if(err){
                console.log(err);
            }else{
                res.render("./campgrounds/index", {campground:allcamp, page: "campgrounds", noMatch: noMatch});
            }
        });
    }
});

//CREATE : Add new campground to DB
router.post("/", middlewareObj.isLoggedIn, upload.single('image'), function(req, res) {
    cloudinary.v2.uploader.upload(req.file.path, async function(err, result) {
      if(err) {
        req.flash('error', err.message);
        return res.redirect('back');
      }
      // add cloudinary url for the image to the campground object under image property
      req.body.campground.image = result.secure_url;
      // add image's public_id to campground object
      req.body.campground.imageId = result.public_id;
      // add author to campground
      req.body.campground.author = {
        id: req.user._id,
        username: req.user.username
      };
      
    //   MAPBOX CODE goes here...
      let response = await geocodingClient
        .forwardGeocode({
            query: req.body.campground.location,
            limit:1
        })
        .send();
      req.body.campground.coordinates = response.body.features[0].geometry.coordinates;
      campground.create(req.body.campground, function(err, campground) {
        if (err) {
          req.flash('error', err.message);
          return res.redirect('back');
        }
        res.redirect('/campgrounds/' + campground.id);
      });
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
    if(err){
        req.flash("error", err.message);
        return res.redirect("back");
    }
    res.render("campgrounds/edit", {campground: camp});
    });
});

//UPDATE: Update the campground & save
router.put("/:id", middlewareObj.isOwnedCampground, upload.single('image'), function(req, res){
    campground.findById(req.params.id, async function(err, foundCampground){
        if(err){
            req.flash("error", err.message);
            return res.redirect("back");
        } else{
            if(req.file){
                try{
                    await cloudinary.v2.uploader.destroy(foundCampground.imageId);
                    let result = await cloudinary.v2.uploader.upload(req.file.path); 
                    foundCampground.imageId = result.public_id;
                    foundCampground.image = result.secure_url;
                }catch(err){
                    req.flash("error", err.message);
                    return res.redirect("back");
                }
            }
            // Check if Location is Updated?
            if(req.body.camp.location !== foundCampground.location){
                let response = await geocodingClient
                    .forwardGeocode({
                        query: req.body.camp.location,
                        limit:1
                    })
                    .send();
                foundCampground.coordinates = response.body.features[0].geometry.coordinates;
                foundCampground.location = req.body.camp.location;
            }
            
            foundCampground.name = req.body.camp.name;
            foundCampground.price = req.body.camp.price;
            foundCampground.description = req.body.camp.description;
            foundCampground.save();
            req.flash("success", "Campground has been Updated successfully!");
            res.redirect("/campgrounds/" + req.params.id);
        }
    });
});

//DESTROY: Delete Campground
router.delete("/:id", middlewareObj.isOwnedCampground, function(req, res){
    campground.findById(req.params.id, async function(err, foundCampground){
        if(err){
            req.flash("error", err.message);
            return res.redirect("/back");
        }
        try{
            await cloudinary.v2.uploader.destroy(foundCampground.imageId);
            foundCampground.remove();
            req.flash("success", "Campground deleted successfully!");
            res.redirect("/campgrounds");
        } catch(err){
            if(err){
                req.flash("error", err.message);
                res.redirect("/back");
            }
        }
    });
});

function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

module.exports= router;