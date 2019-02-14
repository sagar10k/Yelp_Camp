var mongoose    = require("mongoose");
var campground  = require("./models/campground");
var comment     = require("./models/comment");

var seeds=[
    {
        name: "Camp1",
        image: "https://www.fs.usda.gov/Internet/FSE_MEDIA/stelprdb5306226.jpg",
        description: "It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout. The point of using Lorem Ipsum is that it has a more-or-less normal distribution of letters, as opposed to using 'Content here, content here', making it look like readable English. Many desktop publishing packages and web page editors now use Lorem Ipsum as their default model text, and a search for 'lorem ipsum' will uncover many web sites still in their infancy. Various versions have evolved over the years, sometimes by accident, sometimes on purpose (injected humour and the like)."
    },
    {
        name: "Camp2",
        image: "https://www.fs.usda.gov/Internet/FSE_MEDIA/stelprdb5306226.jpg",
        description: "It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout. The point of using Lorem Ipsum is that it has a more-or-less normal distribution of letters, as opposed to using 'Content here, content here', making it look like readable English. Many desktop publishing packages and web page editors now use Lorem Ipsum as their default model text, and a search for 'lorem ipsum' will uncover many web sites still in their infancy. Various versions have evolved over the years, sometimes by accident, sometimes on purpose (injected humour and the like)."
    },
    {
        name: "Camp3",
        image: "https://www.fs.usda.gov/Internet/FSE_MEDIA/stelprdb5306226.jpg",
        description: "It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout. The point of using Lorem Ipsum is that it has a more-or-less normal distribution of letters, as opposed to using 'Content here, content here', making it look like readable English. Many desktop publishing packages and web page editors now use Lorem Ipsum as their default model text, and a search for 'lorem ipsum' will uncover many web sites still in their infancy. Various versions have evolved over the years, sometimes by accident, sometimes on purpose (injected humour and the like)."
    }
];
function seedDB(){
    campground.remove({}, function(err){
        if(err){
            console.log(err);
        }
        console.log("Campgrounds deleted");
        
        seeds.forEach(function(seed){
        campground.create(seed, function(err, camp){
                if(err){
                  console.log(err);
                }else{
                    console.log("campground added");
                    comment.create({
                            text: "This comment works",
                            author: "sagar"
                        },function(err,cmmt){
                            if(err){
                                console.log(err);
                            }else{
                                camp.comments.push(cmmt);
                                camp.save();
                                console.log("comment was created");
                            }
                    });   
                }
            });
        });
        
    });
}
    
module.exports= seedDB;
