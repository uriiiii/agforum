let mongoose = require('mongoose');

let uri = "mongodb+srv://urielgracem:crackheadCC20!@forumdb.bz9x3.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";

let connectionParams={
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
    useFindAndModify: false
}

let database = {
    connect: function () {
        mongoose.connect(uri, connectionParams, function(error) {
            if(error) throw error;
            console.log('Connected to MongoDB Atlas')
        });
    },
}

module.exports = database;