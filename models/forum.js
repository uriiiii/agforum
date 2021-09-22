let mongoose = require('mongoose');

let citySchema = new mongoose.Schema({
	name: String,

});

module.exports = mongoose.model('City', citySchema);

