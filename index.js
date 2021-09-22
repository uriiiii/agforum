const express = require('express');
const dotenv = require(`dotenv`);
const handlebars = require('express-handlebars');
const session = require('express-session');
const expressValidator = require('express-validator');
const passport = require('passport');
const flash = require('connect-flash');

const MongoStore = require('connect-mongo');
const db = require(`./models/db.js`);

dotenv.config();
port = process.env.PORT || 3000;
url = process.env.URI;
secret = process.env.SECRET;

db.connect();

const app = express();
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(session({ 
	secret: secret, 
	saveUninitialized: false, 
	store: MongoStore.create({
            mongoUrl: url
    }),
	
	resave: true, 
	cookie: { secure: false, maxAge: 1000 * 60 * 60 * 24 * 7 }
})
);


app.use(expressValidator({
errorFormatter: function(param, msg, value) {
    var namespace = param.split('.')
    , root    = namespace.shift()
    , formParam = root;

    while(namespace.length) {
    formParam += '[' + namespace.shift() + ']';
    }
    return {
    param : formParam,
    msg   : msg,
    value : value
    };
}
}));

app.set('view engine', 'hbs');
app.engine('hbs',
	handlebars({
		layoutsDir: `${__dirname}/views/layouts`,
		partialsDir: `${__dirname}/views/partials`,
		extname: 'hbs',
		defaultLayout: 'index',
	}),
);

require('./config/passport')(passport)
// http://www.passportjs.org/docs/authenticate/
app.use(passport.initialize());
app.use(passport.session());


app.use(flash());

app.use((req, res, next) => {
	res.locals.messages = require('express-messages')(req, res);
	res.locals.success_msg = req.flash('success_msg');
	res.locals.error_msg = req.flash('error_msg');
	res.locals.error = req.flash('error_msg');
	next();
});


const forum = require('./routes/posts.js');
const user = require('./routes/users.js');

app.get('/', (req, res) => {
	res.render('home');
});

app.get('/aboutus', (req, res) => {
	res.render('about');
});

app.use('/', forum);
app.use('/user', user);

app.get('*', (req, res) => {
	res.render('404');
});

app.listen(port, function () {
    console.log(`Server is running at:`);
    console.log(`http://localhost` `:` + port);
});
