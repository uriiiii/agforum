let express = require('express');
let passport = require('passport');
let multer = require('multer');
let upload = multer({ dest: 'public/uploads/' });
let router = express.Router();

let controller = require('../controller/controller.js');

router.post('/login', passport.authenticate('local', {
		successRedirect: '/commBoard',
		failureRedirect: '/user/login',
		failureFlash: true,
        
	}),
);

router.get('/login', ensurePublic,controller.renderLogin);
router.get('/logout', controller.logout);
router.get('/register', ensurePublic, controller.renderRegister);
router.post('/register', ensurePublic,controller.register);
router.get('/profile', ensureAuthenticated, controller.myProfile);
router.post('/profilePicture',ensureAuthenticated, upload.single('image'), controller.changeUserProfilePicture);

function ensureAuthenticated(req, res, next){
    if(req.isAuthenticated()){
        return next()
    } else {
        res.redirect('/user/login')
    }
}

function ensurePublic(req, res, next){
    if(req.isAuthenticated()){
        res.redirect('/')
    } else {
        return next()
    }
}

module.exports = router;
