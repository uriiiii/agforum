let fs = require('fs');
const bcrypt = require('bcrypt');
let mongoose = require('mongoose');
let User = require('../models/user.js');
let Post = require('../models/post.js');
let Forum = require('../models/forum.js');

async function getPost(req, posts){
	return await Promise.all(
		posts.map(async (post)=>{
			const user = await User.findOne({ _id: post.commissioner}).lean();
			const comments = await Promise.all(
				post.comments.map(async (comment) => {
					const commenter = await User.findOne({ _id: comment.commissioner });
					const commentData = await {
						...comment,
						username: commenter.username,
						profilePicture: commenter.profilePicture,
						Rewards: Number(comment.mora.length),
						
					};

					if (req.user) {
						let isLiked = comment.mora.filter((moras) => moras.commissioner == req.user._id,
						).length;

						return await {
							...commentData,
							isOwned: req.user._id == comment.commissioner,
							isLiked: Boolean(isLiked),
							Rewards: Number(comment.mora.length),
						};
					}

					return await commentData;
				}),
			);

			const postWithComment = {
				...post,
				username: user.username,
				profilePicture: user.profilePicture,
				comments: comments,
				Rewards: Number(post.mora.length),
			};

			if (req.user) {
				let isLiked = await Post.find({
					$and: [{ _id: postWithComment._id }, { 'mora.commissioner': req.user._id }],
				});

				return {
					...postWithComment,
					isOwned: req.user._id == post.commissioner,
					isLiked: Boolean(isLiked.length),
				};
			}
			return postWithComment;
		}),
	);

}

let controller = {

	renderRegister:async function(req,res){
		res.render('register')
	},
	
	register:async function(req,res){
		const name = req.body.name
    	const email = req.body.email
    	const username = req.body.username
    	const password = req.body.password

    let query = {username:username}
    User.findOne(query, function(err, user){
        if (user) {
            req.flash('error_msg','Username taken')
            res.redirect('/user/register')
			console.log("gaya gaya ka");
		}

		else {
            req.checkBody('password2', 'Passwords do not match').equals(req.body.password);
            let errors = req.validationErrors();

            if(errors){
				console.log(errors);
                req.flash('error_msg','Passwords have to match')
            	res.redirect('/user/register')
				console.log("tangek");
            
			} else {
				
                let newUser = new User({
                    name:name,
                    email:email,
                    username:username,
                    password:password,
					dateJoined:new Date(),
                })


                bcrypt.genSalt(10, function(err, salt){
                    bcrypt.hash(newUser.password, salt, function(err, hash){
                        if(err){
                            console.log(err)
                        }
                        newUser.password = hash
                        newUser.save(function(err){ 
                            if(err) {
                                console.log(err)
                                return
                            } else {
                                req.flash('success_msg','Registered successfully!!');
								console.log("working");
                                res.redirect('/user/login')
                            }
                        })
                    })
                })
            }

        } 
    })
	},
	
	renderLogin:async function(req,res){
		if (req.user !== undefined) return res.redirect('/');
	
		if (req.session.messages) {
			return res.render('login')
		}
	
		res.render('login');
	},
	
	logout:async function(req,res){
		req.logout();
    	req.flash('Success','Logged out.')
    	res.redirect('/')

	},
	
	myProfile:async function(req,res){
		console.log("is working?");
		
		let user = await User.findOne({ _id: req.user._id}).lean();
		let query = await Post.find({commissioner: user._id}).lean();
		
		let Posts = await getPost(req, query);
		
		return res.render('profile', {
			user: user,
			posts: Posts,
		})
	},
	
	changeUserProfilePicture:async function(req,res){
		
		let image = {
			data: fs.readFileSync(req.file.path).toString('base64'),
			filename: req.file.originalname,
			contentType: req.file.mimetype,
		};
	
		try{
			await User.findOneAndUpdate({ _id: req.user._id },{ $set: { profilePicture: image } },);
			res.redirect('/')

		}
		catch (error) {
		res.render('404', {error:error})
		}
	},

	//POSTS
	getBoard:async function(req, res){
		
		try{
			let posts = await Post.find({}).sort({ date: -1 }).lean();
			let Posts = await getPost(req, posts);
	
			return res.render('forum', {posts: Posts})

		}
		catch(error){
			console.log(error);
			res.render('404', { error: error })
		}
	},

	byCity:async function(req, res){
		let { forumName } = req.params;
	
		try {
			let cityID = await Forum.findOne({ name: forumName});
			let posts = await Post.find({cityID: cityID._id}).sort({ date: -1 }).lean();
	
			let Posts = await getPost(req, posts);
			
			return res.render('forum', {
				posts: Posts,
				forumName: cityID.name,
				forumDescription: cityID.description,
			})

		} catch (error) {
			console.log(error);
			res.render('404', { error: error })
		}
	},
	
	searchPosts:async function(req, res){
		let { search: searchItem } = req.query;
	
		try {
			let posts = await Post.find({
				$or: [{ headline: { $regex: new RegExp(`\\b(${searchItem})\\b`), $options: 'i' } },{ info: { $regex: new RegExp(`\\b(${searchItem})\\b`), $options: 'i' } },],
			}).sort({ date: -1 }).lean();
	
			let Posts = await getPost(req, posts);
	
			return res.render('search', {
				posts: Posts,
				forumName: 'Search',
				isSearch: true,
			})
		} catch (error) {
			res.render('404',{error:error})
		}
	},
	
	comment:async function(req, res){
		let { postId } = req.params;
		
		const {content} = req.body;
		console.log(content);

		let comment = {
			_id: mongoose.Types.ObjectId(),
			commissioner: req.user._id,
			info: content,
			date: new Date(),
		};
	
		try {
			await Post.findOneAndUpdate({ _id: postId }, { $push: { comments: comment } },{useFindAndModify: false});
		} catch (error) {
			res.render('404',{error:error})
		}
	
		return res.redirect('back')
	},


	upvoteComment:async function(req, res){
		let { commentId } = req.params;
	
		let reaction = {
			commissioner: req.user._id,
		};
	
		try {
			await Post.findOneAndUpdate(
				{ 'comments._id': commentId },{
					$push: { 'comments.$.mora': reaction },
				},
			);
	
			res.redirect('back')
		} catch (error) {
			res.render('404',{error:error})
		}
	},
	
	editPage:async function(req, res){
		let { postId } = req.params;
	
		let post = await Post.findOne({ _id: postId }).lean();
		let { username } = await User.findOne({ _id: post.commissioner });
	
		let postData = {
			...post,
			username: username,
		};
	
		res.render('editpost', { post: postData })
	},
	
	editPost:async function(req, res){
		let { postId } = req.params;
		let { title, content } = req.body;
	
		try {
			await Post.findByIdAndUpdate({ _id: postId },{ $set: { headline: title, info: content } },);
			res.redirect('/commBoard')

		} catch (error) {
			res.render('404', {error: error})
		}
	},
	
	editCPage:async function(req, res){
		let { commentId } = req.params;
	
		let { comments } = await Post.findOne({ 'comments._id': commentId }).lean();
		let comment = comments.filter((element) => element._id == commentId);
		res.render('editcomment', { comment: comment[0] })
	},
	
	editComment:async function(req, res){
		let { commentId } = req.params;
		let { content } = req.body;
	
		await Post.findOneAndUpdate({ 'comments._id': commentId }, {$set: { 'comments.$.info': content }},
		);
		res.redirect('/commBoard')
	},
	
	addPost:async function(req, res){
		try {
			let {title,content,city} = req.body;
			console.log(city);
			
		
			let forum = await Forum.findOne({ name: city });

			if (req.file) {
				let image = {
					data: fs.readFileSync(req.file.path).toString('base64'),
					filename: req.file.originalname,
					contentType: req.file.mimetype,
				};

				

				console.log(image);
	
				let query = new Post({
					commissioner: req.user._id,
					cityID: forum._id,
					headline: title,
					image: image,
					info: content,
					date: new Date(),
				});
	
				fs.unlink(req.file.path, (error) => {
					if (error) return res.render('/')
				});
	
				await query.save();

			} else {
				let query = new Post({
					commissioner: req.user._id,
					cityID: forum._id,
					headline: title,
					info: content,
					date: new Date(),
				});
	
				await query.save();
			}
	
			return res.redirect('back');

		} catch (error) {
			res.render('404', { error: error })
			console.log(error);
		}
	},
	
	upvotePost:async function(req, res){
		let { postId } = req.params;
		let reaction = {commissioner: req.user._id,
		};
	
		try {
			await Post.findOneAndUpdate({ _id: postId }, { $push: { mora: reaction } });
			res.redirect('back')
			
		}
		catch (error) {
			res.render('404', {error: error})
		}
	},
	
	downvotePost:async function(req, res){
		let { postId } = req.params;
		console.log(req.params);
	
		try {
			await Post.findOneAndUpdate({ _id: postId },{ $pull: { mora: { commissioner: req.user._id } } },);
			res.redirect('back')

		}
		catch (error) {
			res.render('404', {error: error})
		}
	},
	
	downvoteComment:async function(req, res){
		let { commentId } = req.params;
	
		try {
			await Post.findOneAndUpdate(
				{ 'comments._id': commentId },
				{ $pull: { 'comments.$.mora': { commissioner: req.user._id } } },
			);
	
			res.redirect('back')
		} catch (error) {
			res.render('404', {error: error})
		}
	},
	
	deletePost:async function(req, res){
		let { postId } = req.params;
	
		try {
			await Post.deleteOne({ _id:postId });
			res.redirect('back')

		}
		catch (error) {
			res.render('404',{error:error})
		}
	},
	
	deleteComment:async function(req, res){
		let { commentId } = req.params;
	
		try {
			await Post.findOneAndUpdate({ 'comments._id': commentId },{ $pull: { comments: { _id: commentId } } },);
			res.redirect('back')

		} catch (error) {
			console.log(error);
			res.render('404',{error:error})
		}
	},

	viewProfile:async function(req,res){
		let { username } = req.params;
		console.log(username);
		let user = await User.findOne({ username: username}).lean();
		let query = await Post.find({commissioner: user._id}).lean();
		
		let Posts = await getPost(req, query);
		
		return res.render('profile', {
			user: user,
			posts: Posts,
		})
	},


}

module.exports = controller;