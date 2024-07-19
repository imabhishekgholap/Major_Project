if(process.env.NODE_ENV != "production"){
    require('dotenv').config();
}

// if something happening wrong then there is mistake it not happening byself
const mongoose = require("mongoose");
const express = require("express");
const app = express();
const path = require("path");
const method_override = require("method-override");
const ejsMate = require("ejs-mate");
const { publicDecrypt } = require("crypto");

// const MONGO_URL= "mongodb://127.0.0.1:27017/wanderlust";
const dbUrl = process.env.ATLASDB_URL;

const ExpressError = require("./utils/ExpressError.js");

const listingRouter = require("./routes/listing.js"); // for restructuring purpose bcz our code be readable and even after 6 months we want to update something it will easy for us
const reviewRouter = require("./routes/reviews.js");
const userRouter = require("./routes/user.js")

const session = require("express-session");
const MongoStore = require('connect-mongo');
const flash = require("connect-flash");
const passport = require("passport");
const Localstrategy = require("passport-local");
const User = require("./models/user.js");

main().then(()=>{
    console.log("Connected to DB");
})
.catch((err)=>{
    console.log(err);
});

async function main(){
await mongoose.connect(dbUrl);
}

app.set("view engine","ejs");
app.set("views", path.join(__dirname,"views"));
app.use(express.urlencoded({extended:true}));
app.use(method_override("_method"));
app.engine('ejs', ejsMate);
app.use(express.static(path.join(__dirname,"/public")));

const store = MongoStore.create({
    mongoUrl: dbUrl,//we our data info is storing on atlas if we want it store on local we can use our mongourl
    cryopto: {
        secret: process.env.SECRET,
    },
touchAfter:24*3600, //We using session on mobile and we close it then also it store for sometime i.e so if we didnt update any info so we don't want that session update so we will declare 1 specific time interval
});

store.on("error",() => {
    console.log("Error in Mongo session store",error);
});

const sessionOptions = {
    store,
    secret:process.env.SECRET,//No one can able to see out secret code because of that we can hide it into the env and we will never push env onto the github
    resave: false,
    saveUninitialized: true,
    cookie: {
        expires: Date.now() + 7 * 24 * 60 *60 *1000,//Every application has their time of logging period that git has 7days same like facebook having some around 21 days so in this area we can able to limit the logging period
        maxAge:7 * 24 * 60 *60 *1000,
        httpOnly: true,
    },
};

app.use(session(sessionOptions));
app.use(flash());
app.use(passport.initialize())//for every request passport will initialize now
app.use(passport.session());//in one page user can open different links of same web applications from page to page for taking track of them , //every request will actually know that which is she part of
passport.use(new Localstrategy(User.authenticate()));//Use static authentic method of model in localstrategy

passport.serializeUser(User.serializeUser());//when user login we stored all the information regarding user 
passport.deserializeUser(User.deserializeUser());//after session is over or user is left we delete all the related data

// this locals helps in from any of directory we are able to fetch this information
app.use((req,res,next)=>{
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser = req.user;
    next();
});

// app.get("/",(req,res)=>{
//     res.send("Hi, I am root");
// });bcz someone can access this page via / route

app.use("/listings",listingRouter);
app.use("/listings/:id/reviews",reviewRouter);//ufcourse we able to see from here that ki our remaining all parameters are went towards the reviews but id is remain here so for that ki hamara id jo parameter hai wo yehi pr na rah jaye wo reviews me bhi chala jaye so for that, // so for that ki parents ke pass ki property child ke pass chali jaye ham reviews me router ke pass kuch aisa karenge->const router = express.Router({mergeParams:true});
app.use("/",userRouter);

// custom 404 Not Found middleware
app.all("*", (req,res,next) =>{
    next( new ExpressError(404,"Page Not Found!"));
});

// General error handling middleware
app.use((err,req,res,next)=> {
    let {statuscode = 500,message = "Something went wrong"} = err; 
    res.status(statuscode).render("error.ejs", {message});
});

// start the server
app.listen(8080,()=>{
    console.log("Server is listening to port 8080");
});

