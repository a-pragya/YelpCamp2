const User = require('../models/user')

module.exports.renderRegisterForm = (req,res)=>{
    res.render('user/register')
}

module.exports.createNewUser= async(req,res, next)=>{
    try{
        const {email, username, password} = req.body;
        const user = new User({email, username})
        const registeredUser = await User.register(user, password)
        req.login(registeredUser, err =>{
            if (err) return next(err)
            req.flash('success','created new user')
        res.redirect('/campgrounds')
        })
        
    }
    catch(e){
        req.flash('error', e.message)
        res.redirect('/campgrounds')
    }

}

module.exports.renderLoginForm = (req,res)=>{
    res.render('user/login')
}

module.exports.login = (req,res)=>{
    req.flash("welcome back!")
    const redirectUrl = req.session.returnTo || '/campgrounds'
    delete req.session.returnTo;
    res.redirect(redirectUrl)
}

module.exports.logout = (req,res)=>{
    req.logout();
    req.flash('success','Logged out successfully')
    res.redirect('/campgrounds')
}