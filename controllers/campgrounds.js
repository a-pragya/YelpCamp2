const Campground = require('../models/campground')
const {cloudinary} = require('../cloudinary')
const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding")
const mapBoxToken = process.env.MAPBOX_TOKEN
const geocoder = mbxGeocoding({accessToken: mapBoxToken})

module.exports.renderIndex = async (req, res) => {
    const campgrounds = await Campground.find({})
    res.render('campground/index', { campgrounds })
}

module.exports.renderCreateForm = (req, res) => {
    res.render('campground/create')
}

module.exports.showCampground = async (req, res) => {
    const camp = await Campground.findById(req.params.id).populate({
        path: 'reviews',
        populate:{
            path:'author'
        }
    }).populate('author');
    if(!camp){
        req.flash('error','Cannot find that campground');
        return res.redirect('/campgrounds');
    }
    
    res.render('campground/show', { camp })
}

module.exports.renderEditForm = async (req, res) => {
    const camp = await Campground.findById(req.params.id)
    if(!camp){
        req.flash('error','Cannot find that campground!');
        return res.redirect('/campgrounds')
    }
    res.render('campground/update', { camp })

}

module.exports.editCampground = async (req, res) => {
    console.log("req.body",req.body)
    const camp = await Campground.findByIdAndUpdate(req.params.id, req.body.campground)
    const imgs = req.files.map(f => ({url: f.path, filename: f.filename}))
    camp.images.push(...imgs)
    await camp.save()
    if(req.body.deleteImages){
        for(let filename of req.body.deleteImages){
            await cloudinary.uploader.destroy(filename);
        }
        await camp.updateOne({ $pull: { images: {filename :{ $in: req.body.deleteImages}}}})
    }
    req.flash('success','Successfully updated campground32!')
    res.redirect(`/campgrounds/${req.params.id}`)
}

module.exports.createCampground = async (req, res) => {
    const geoData = await geocoder.forwardGeocode({
        query: req.body.campground.location,
        limit:1
    }).send()
    const camp = new Campground(req.body.campground)
    camp.images = req.files.map(f => ({ url: f.path, filename: f.filename}));
    camp.author = req.user._id;
    camp.geometry = geoData.body.features[0].geometry;
    await camp.save()
    console.log("new campground",camp)
    console.log("geodata", geoData)
    req.flash('success','Successfully created campground!')
    res.redirect(`/campgrounds/${camp._id}`)
}

module.exports.deleteCampground = async (req, res) => {
    console.log("in delete")
    await Campground.findByIdAndDelete(req.params.id)
    req.flash('success','Successfully deleted campground')
    res.redirect('/campgrounds')
}

//module.exports = campgroundsController