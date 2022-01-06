const Campground = require('../models/campground')
const Review = require('../models/review')

module.exports.createReview = async (req, res) => {
    const campground = await Campground.findById(req.params.id)
    const review = new Review(req.body.review)
    review.author = req.user._id;
    campground.reviews.push(review)
    await campground.save()
    await review.save()
    req.flash('success','Created new review!')
    res.redirect(`/campgrounds/${campground._id}`)
    //res.send("done")
}

module.exports.deleteReview = async (req, res) => {
    console.log("hit")
    const { id, reviewId } = req.params
    await Campground.findByIdAndUpdate(id, { $pull: { review: reviewId } })
    await Review.findByIdAndDelete(reviewId)
    req.flash('success','Successfully deleted review')
    res.redirect(`/campgrounds/${id}`)
}