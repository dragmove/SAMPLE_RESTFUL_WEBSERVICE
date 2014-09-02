'use strict';

var express = require('express'),
	app = express();

/*
 * middleware - https://github.com/senchalabs/connect#middleware
 */
var morgan = require('morgan'),
	bodyParser = require('body-parser'),
	methodOverride = require('method-override'),
	errorHandler = require('errorhandler');

// custom routes javascript file. 'ㅁ')!
var customRoutes = require('./custom-routes');

app.use(bodyParser.urlencoded({ extended: true })); // parse application/x-www-form-urlencoded
app.use(bodyParser.json()); // parse application/json
app.use(methodOverride('X-HTTP-Method-Override')); // override with the X-HTTP-Method-Override header in the request
app.use(express.static(__dirname + '/public'));


var cookieParser = require('cookie-parser');
app.use(cookieParser());

var session = require('express-session');
app.use(session({
	secret:'test',
	saveUninitialized:true,
	resave: true,
}));

var env = process.env.NODE_ENV || 'development';
if ('development' == env) {
    app.use(morgan('combined'));
	app.use(errorHandler({
		dumpExceptions: true,
		showStack: true
	}));
}

customRoutes.configRoutes(app, server);

var server = app.listen(52273, function() {
	console.log('Listening on port %d', server.address().port);
});

/*
{
    "_id": "53fd357a870a8d0a35d984b3",
    "name": "Miss.Lee",
    "is_online": false
}
*/