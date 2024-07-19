const Joi = require("joi");
// server side schema validation
module.exports.listingSchema = Joi.object({
listing: Joi.object({
  title: Joi.string().required(),
  description: Joi.string().required(),
  location: Joi.string().required(),
  country: Joi.string().required(),
  price: Joi.number().required(),
  image: Joi.string().allow("",null),
}).required(),
});

// for server side review validation
module.exports.reviewSchema = Joi.object({
  review: Joi.object({
  rating : Joi.number().required().min(1).max(5), 
  comment: Joi.string().required(), 
  }).required(),
  });