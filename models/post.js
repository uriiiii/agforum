let mongoose = require('mongoose');

let postSchema = new mongoose.Schema({
	commissioner: { 
		type: String,
		required: true
	},

	cityID: { 
		type: String, 
		required: true 
	},
	
	headline: {
		type: String, 
		required: true 
	},

	info: { 
		type: String, 
		required: true 
	},
	
	image: { 
		data: Buffer, 
		filename: String, 
		contentType: String 
	},
	
	mora: [{ commissioner: String }],
	date: { type: Date, required: true },
	
	comments: [
		{
			_id: String,
			commissioner: String,
			info: String,
			date: Date,
			mora: [{ commissioner: String }],
		},
	],
	
	
});

module.exports = mongoose.model('Post', postSchema);
