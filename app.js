if(process.env.NODE_ENV !== "production"){
    require('dotenv').config();
}

const express = require('express')
const mongoose = require('mongoose')
const session = require('express-session')
const MongoDBStore = require("connect-mongo");
const Campground = require('./models/campground')
const Review = require('./models/review')
const methodOverride = require('method-override')
const ejsMate = require('ejs-mate')
const flash= require('connect-flash')
const mongoSanitize = require('express-mongo-sanitize');

const ExpressError = require('./utils/ExpressError')
//const catchAsync = require('./utils/catchAsync')
const { campgroundSchema } = require('./schemas')
const { reviewSchema } = require('./schemas')

const userRoutes = require('./routes/user.js');
const campgroundsRoutes = require('./routes/campgrounds');
const reviewsRoutes = require('./routes/reviews');

const passport = require('passport');
const LocalStrategy = require('passport-local')
const User = require('./models/user')


//dbURL='mongodb://localhost:27017/yelp-camp'
const dbURL=process.env.DB_URL || 'mongodb://localhost:27017/yelp-camp'
mongoose.connect(dbURL, {
    useNewUrlParser: true,
    //useCreateIndex: true,
    useUnifiedTopology: true
})

const db = mongoose.connection
db.on("error", console.log.bind(console, "connection error:"))
db.once("open", () => {
    console.log("Database connected ")
})



const app = express()
const path = require('path')
const { required } = require('joi')

app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'))
app.engine('ejs', ejsMate)
app.use(express.urlencoded({ extended: true }))
app.use(methodOverride('_METHOD'))
app.use(express.static(path.join(__dirname, 'public')))

// const store = new MongoDBStore({
//     url: dbURL,
//     secret,
//     touchAfter: 24 * 60 * 60
// });
// store.on("error", function (e) {
//     console.log("SESSION STORE ERROR", e)
// })

const secret = process.env.SECRET || 'thisshouldbeabettersecret!';

const sessionConfig = {
    store: MongoDBStore.create({ mongoUrl: dbURL }),
    name:'session',
    secret,
    resave: false,
    saveUninitialized: true,
    cookie:{
        httpOnly: true,
        expires: Date.now() + 1000*60*60*24*7,
        maxAge: 1000*60*60*24*7
    }
}

app.use(session(sessionConfig))
app.use(flash())
app.use(mongoSanitize({
    replaceWith: '_'
}))

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req,res, next) =>{
    //console.log(req.session)
    res.locals.currentUser = req.user;
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
})

app.use('/', userRoutes)
app.use('/campgrounds',campgroundsRoutes)
console.log("path")
app.use('/campgrounds/:id/reviews',reviewsRoutes)

app.get('/', (req, res) => {
    //res.send("hello world")
    res.render('index')
})

// app.get('/fakeUser', async (req,res)=>{
//     const user = new User({email: 'pog@gmail.com', username: 'pogo'});
//     const newUser = await User.register(user, 'password');
//     res.send(newUser)
// })

app.all('*', (req, res, next) => {
    next(new ExpressError("Page Not Found", 404))
})

app.use((err, req, res, next) => {
    const { statusCode = 500 } = err;
    if (!err.message) err.message = 'Oh no something went wrong!'
    res.status(statusCode).render('error', { err })

})

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`listening on port ${port}`)
})