var express = require('express'),
	app = express();

/*
 * middleware - https://github.com/senchalabs/connect#middleware
 */
var morgan = require('morgan'),
	bodyParser = require('body-parser'),
	methodOverride = require('method-override'),
	errorHandler = require('errorhandler');

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));

// parse application/json
app.use(bodyParser.json());

// override with the X-HTTP-Method-Override header in the request
app.use(methodOverride('X-HTTP-Method-Override'));

app.use(express.static(__dirname + '/public'));

var env = process.env.NODE_ENV || 'development';
if ('development' == env) {
   app.use(morgan('combined'));
	app.use(errorHandler({
		dumpExceptions: true,
		showStack: true
	}));
}

/*
 * redirect
 */
app.get('/', function(req, res) {
	res.redirect( '/index.html' );
});

app.all('/user/*?', function(req, res, next) {
	res.contentType('json');
	next();
});


app.get('/user/list', function(req, res) {
	// res.contentType('json');
	res.send({
		title: 'user list'
	});
});

/*
app.get('/user/read/:id', function(req, res) {
	// res.contentType('json');
	res.send({
		title: 'user with id ' + req.params.id + ' found'
	})
});
*/
app.get('/user/read/:id([0-9]+)', function(req, res) {
	// res.contentType('json');
	res.send({
		title: 'user with id ' + req.params.id + ' found'
	});
});

app.post('/user/create', function(req, res) {
	// res.contentType('json');
	res.send({
		title: 'user created'
	});
});

app.post('/user/update/:id([0-9]+)', function(req, res) {
	// res.contentType('json');
	res.send({
		title: 'user with id ' + req.params.id + ' update'
	});
});

app.get('/user/delete/:id([0-9]+)', function(req, res) {
	// res.contentType('json');
	res.send({
		title: 'user with id ' + req.params.id + ' delete'
	})
});

var server = app.listen(52273, function() {
	console.log('Listening on port %d', server.address().port);
});