'use strict';

//mongodb doc : https://github.com/mongodb/node-mongodb-native

var MongoClient = require('mongodb').MongoClient,
	Server = require('mongodb').Server;

var ObjectID = new require('mongodb').ObjectID,
	objTypeMap = {
		'user': {}
	};

var crypto = require('crypto');

var mongoClient = new MongoClient(new Server('localhost', 27017)),
	db;

mongoClient.open(function(err, mongoClient) {
	console.log('connect open mongodb');

	db = mongoClient.db('spa');
	// mongoClient.close();
});

//load json schema file
var JSV = require('JSV').JSV,
	validator = JSV.createEnvironment();

var fsHandle = require('fs'),
	loadSchema = function(schema_name, schema_path) {
		console.log('load schema complete');

		fsHandle.readFile(schema_path, 'utf-8', function(err, data) {
			objTypeMap[ schema_name ] = JSON.parse(data);
		});
	},
	checkSchema = function(obj_type, obj_map, callback) {
		var schema = {'type': typeof(objTypeMap[obj_type])},
			report = validator.validate(obj_map, schema);
		callback(report.errors);
	};

(function() {
	var schema_name,
		schema_path;
	for(schema_name in objTypeMap) {
		if(objTypeMap.hasOwnProperty(schema_name)) {
			schema_path = __dirname + '\\' + schema_name + '.json';
			loadSchema(schema_name, schema_path);
		}
	}	
})();

var configRoutes = function(app, server) {
	/*
	 * /:obj_type/create, /:obj_type/list, /:obj_type/read/:id, /:obj_type/delete/:id, /:obj_type/update/:id
	 * /:obj_type/me, /:obj_type/logout, /:obj_type/login 
	 *
	 */

	/*
	 * redirect
	 */
	app.get('/', function(req, res) {
		res.redirect( '/index.html' );
	});

	app.all('/:obj_type/*?', function(req, res, next) {
		res.contentType('json');

		//data 유효성 검사. :obj_type 으로 'user'만 pass시킨다.
		if(objTypeMap[ req.params.obj_type ]) {
			next();
		}else{
			res.send({
				error_msg : req.params.obj_type + ' is not a valid object type'
			});
		}
	});

	app.post('/:obj_type/login', function(req, res) {
		var loginId = req.param('login_id'),
			password = req.param('password');

		if(loginId && password) {
			var collection = db.collection(req.params.obj_type);
			collection.findOne( {login_id:loginId}, function(err, result) {
				if(result) {
					var shasum = crypto.createHash('sha1');
					shasum.update(password);
					var hash = shasum.digest('hex');

					if(hash === result.hash) {
						//go success login page

						req.session.me = result;
						res.status(200).send({
							msg : 'success'
						});
					}else{
						res.status(400).send({
							error_msg : 'not valid password'
						});
					}
				}else{
					res.status(400).send({
						error_msg : 'not member'
					});
				}
			});
		} else {
			res.status(400).send({
				error_msg : 'params not valid'
			});
		}
	});

	app.get('/:obj_type/logout', function(req, res) {
		if(req.session.me) {
			req.session.destroy();
			res.status(200).send({
				msg : 'success logout'
			});
		}else{
			res.status(401).send({
				error_msg : 'not authorized.'
			});
		}
	});

	app.get('/:obj_type/me', function(req, res) {
		if(req.session.me) {
			res.status(200).send({
				msg : req.session.me
			});
		}else{
			res.status(401).send({
				error_msg : 'not authorized.'
			});
		}
	});

	app.post('/:obj_type/join', function(req, res) {
		var loginId = req.param('login_id'),
			password = req.param('password');

		if(loginId && password) {
			var collection = db.collection(req.params.obj_type);
			collection.findOne( {login_id:loginId}, function(err, result) {
				if(result) {
					//Status code 409
					res.status(409).send({
						error_msg:'HTTP Error 409 Conflict'
					});
				}else{
					var shasum = crypto.createHash('sha1');
					shasum.update(password);
					var hash = shasum.digest('hex');

					var options = {};
					collection.insert( {login_id:loginId, hash:hash}, options, function(innerErr, innerResult) {
						if(innerErr) {
							res.status(500).send({
								error_msg:'HTTP Error 500 Internal server error'
							});
						}else{
							//complete join member
							res.send(innerResult);
						}
					});
				}
			});
		} else {
			res.send({
				error_msg : '400 error'
			});
		}
	});

	app.get('/:obj_type/list', function(req, res) {
		/*
		res.contentType('json');
		res.send({
			title: req.params.obj_type + ' list'
		});
		*/

		var collection = db.collection(req.params.obj_type);
		collection.find().toArray(function(err, results) {
			console.log('results :', results);
			res.send(results);
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
	/*
	app.get('/:obj_type/read/:id([0-9]+)', function(req, res) {
		res.contentType('json');
		res.send({
			title: req.params.obj_type + ' with id ' + req.params.id + ' found'
		});
	});
	*/
	app.get('/:obj_type/read/:id', function(req, res) {
		var collection = db.collection(req.params.obj_type);
		collection.findOne( {_id:new ObjectID(req.params.id)}, function(err, result) {
			res.send(result);
		});
	});

	app.get('/:obj_type/delete/:id', function(req, res) {
		var options = {
			remove: true, // set to a true to remove the object before returning
			new: false, // set to true if you want to return the modified object rather than the original. Ignored for remove.
			upsert: false // Atomically inserts the document if no documents matched.
		};

		// collection.findAndModify(query, sort, update, options, callback)
		var collection = db.collection(req.params.obj_type);
		collection.findAndModify( {_id:new ObjectID(req.params.id)}, [['_id','asc']], null, options, function(err, object) {
	    	if (err) {
	    		console.warn('err :', err.message);
	    	} else {
	    		console.dir('success delete :', object);  // undefined if no matching object exists.
	    	}

	    	//require - set delete success message
	    	res.send(object);
	    });
	});

	app.post('/:obj_type/create', function(req, res) {
		/*
		res.contentType('json');
		res.send({
			title: req.params.obj_type + ' created'
		});
		*/
		
		var obj_type = req.params.obj_type,
			obj_map = req.body;

		checkSchema(obj_type, obj_map, function(error_list) {
			if(error_list.length === 0) {
				db.collection(obj_type, function(err, collection) {
					var options = { safe: true };
					collection.insert(obj_map, options, function(innerErr, result) {
						res.send(result);
					});
				});
			}else{
				res.send({
					error_msg:'Input document not valid',
					error_list: error_list
				});
			}
		});

		/*
		var options = { w:1 },
			obj = req.body;	

		console.log('obj :', obj);

		var collection = db.collection(req.params.obj_type);
		collection.insert(obj, options, function(err, objects) {
			res.send(objects);
		});
		*/
	});

	/*
	app.post('/:obj_type/update/:id([0-9]+)', function(req, res) {
		// res.contentType('json');
		res.send({
			title: req.params.obj_type + ' with id ' + req.params.id + ' update'
		});
	});
	*/
	app.post('/:obj_type/update/:id', function(req, res) {
		var options = {
			remove: false, // set to a true to remove the object before returning
			new: true, // set to true if you want to return the modified object rather than the original. Ignored for remove.
			upsert: false // Atomically inserts the document if no documents matched.
		},
		obj_type = req.params.obj_type,
		obj_map = req.body;

		checkSchema(obj_type, obj_map, function(error_list) {
			if(error_list.length === 0) {
				// collection.findAndModify(query, sort, update, options, callback)
				var collection = db.collection(obj_type);
				collection.findAndModify( {_id:new ObjectID(req.params.id)}, [['_id','asc']], {$set:obj_map}, options, function(err, object) {
			    	if (err) {
			    		console.warn('err :', err.message);
			    	} else {
			    		console.dir('success :', object);  // undefined if no matching object exists.
			    	}
			    	res.send(object);
			    });
			}else{
				res.send({
					error_msg:'Input document not valid',
					error_list: error_list
				});
			}
		});
	});
};

module.exports = {
	configRoutes: configRoutes
};