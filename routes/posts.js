let express = require('express');
let router = express.Router();
let multer = require('multer');
let upload = multer({ dest: 'public/uploads/' });
let controller = require('../controller/controller.js');


router.get('/commBoard',  ensureAuthenticated, controller.getBoard);
//router.post('/commBoard',  ensureAuthenticated, controller.postsBoard);

router.get('/get/:forumName',  ensureAuthenticated,controller.byCity);
router.get('/contain/search',  ensureAuthenticated, controller.searchPosts);
//router.post('/:forumName',  ensureAuthenticated, controller.postsbyCity);

router.post('/createpost', ensureAuthenticated,upload.single('image'), controller.addPost);
router.post('/insert-reaction/:postId',ensureAuthenticated, controller.upvotePost);
router.post('/delete-reaction/:postId',ensureAuthenticated, controller.downvotePost);

router.get('/editpost/:postId', ensureAuthenticated, controller.editPage);
router.post('/editpost/:postId', upload.none(), ensureAuthenticated, controller.editPost);

router.post('/post/:postId', controller.deletePost);

router.post('/createcomment/:postId', ensureAuthenticated, upload.none(), controller.comment);
router.post('/insert/reaction/:commentId', ensureAuthenticated, controller.upvoteComment);
router.post('/delete/reaction/:commentId',ensureAuthenticated, controller.downvoteComment);

router.get('/editcomment/:commentId', ensureAuthenticated, controller.editCPage);
router.post('/editcomment/:commentId', ensureAuthenticated,upload.none(), controller.editComment);
router.post('/comment/:commentId',ensureAuthenticated, controller.deleteComment);

router.get('/viewProfile/:username', controller.viewProfile);

function ensureAuthenticated(req, res, next){
    if(req.isAuthenticated()){
        return next()
    } else {
        res.redirect('/user/login')
    }
}

module.exports = router;
