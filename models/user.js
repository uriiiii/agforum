let mongoose = require('mongoose');
let { Schema } = mongoose;
let passportLocalMongoose = require('passport-local-mongoose');

let userSchema = new Schema({
	name:{
        type: String,
        required: true
    },

    email:{
        type: String,
        required: true
    },
    
    username:{
        type: String,
        required: true
    },

    password:{
        type: String,
        required: true
    },
	
	profilePicture: { 
        data: Buffer, 
        filename: String, 
        contentType: String, 
        
    },

    dateJoined: {type: Date},
});

userSchema.plugin(passportLocalMongoose);
module.exports = mongoose.model('User', userSchema);

