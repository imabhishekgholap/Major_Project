const listing = require("./models/listing.js");//IF ERROR DO HERE listing
const mongoose = require("mongoose");
const express = require("express");
const Review = require("./models/review.js");
const User = require("./models/user");
const {listingSchema, reviewSchema} = require("./schema.js");
const ExpressError = require("./utils/ExpressError.js");

module.exports.isLoggedIn = (req,res,next) =>{
    if(!req.isAuthenticated()){
        req.session.redirectUrl = req.originalUrl;
        req.flash("error","You must be logged in to make changes in this page.");
        res.redirect("/login");
    }
    next();
}


module.exports.saveRedirectUrl = (req,res,next) =>{
    if(req.session.redirectUrl){
        res.locals.redirectUrl = req.session.redirectUrl;
    }
    next();
}

// through this we done with server as well as client side validations
module.exports.validatelisting = (req,res,next) =>{
    let {error} = listingSchema.validate(req.body);
    if(error)
    {
        // sare error elements me nikal liye ab unhe join krke , separate kiya jayega
        let errMsg = error.details.map((el) => el.message).join(",");
        throw new ExpressError(400,error);
    }
    else{
        next();
    }
};

// middleware.js
module.exports.isReviewAuthor = async (req, res, next) => {
    let { id, reviewId } = req.params;
    let review = await Review.findById(reviewId).populate('author');

    if (!review || !review.author || !review.author._id.equals(res.locals.currUser._id)) {
        req.flash("error", "You are not the author of the review");
        return res.redirect(`/listings/${id}`);
    }

    next();
};

module.exports.validateReview = (req,res,next) =>{
    let {error} = reviewSchema.validate(req.body);
    if(error)
    {
        // sare error elements me nikal liye ab unhe join krke , separate kiya jayega
        let errMsg = error.details.map((el) => el.message).join(",");
        throw new ExpressError(400,error);
    }
    else{
        next();
    }
};

module.exports.isOwner = async (req,res,next) =>{
    let {id} = req.params;
    let foundlisting = await listing.findById(id);
    if(!foundlisting.owner._id.equals(res.locals.currUser._id))
    {
        req.flash("error","You are not the owner of the listing");
        return res.redirect(`/listings/${id}`);
    }
    next();
}