
/**
 * Module dependencies.
 */

var cluster = require('cluster');

	var mysql = require('mysql');
	var express = require('express');
	var SessionStore = require('express-mysql-session')
	var routes = require('./routes');
	var user = require('./routes/user');
	var sessions = require('cookie-sessions');
	var session = require('./routes/session');
	var bulk = require('./routes/bulk');
	var photo = require('./routes/photo');
	var http = require('http');
	var path = require('path');
	var crypto = require('crypto');
	
	var options = {
		host: 'web2.cpsc.ucalgary.ca',
	        port: 3306,
		  user: 's513_amazazi',
		  password: '10063797',
		  database: 's513_amazazi'
	    }
	
	var conn = mysql.createConnection({
	  host: 'web2.cpsc.ucalgary.ca',
	  user: 's513_amazazi',
	  password: '10063797',
	  database: 's513_amazazi'
	});
	
	var app = express();
	
	// all environments
	app.set('port', 8551);
	app.set('views', path.join(__dirname, 'views'));
	app.set('view engine', 'jade');
	
	app.set('view options', { locals: { scripts: ['jquery.js'] } });
	
	app.use(express.favicon());
	app.use(express.logger('dev'));
	app.use(express.json());
	app.use(express.bodyParser({ keepExtensions: true, uploadDir: __dirname + '/images' }));
	//app.use(express.urlencoded());
	app.use(express.methodOverride());
	app.use(require('stylus').middleware(path.join(__dirname, 'public')));
	app.use(express.static(path.join(__dirname, 'public')));
	app.use(express.cookieParser());
	app.use(express.cookieSession({ key: 'connect.sid', secret: 'SENG513', cookie: { maxAge: 60 * 60 * 1000 }}));
	app.use(app.router);
	
	// development only
	if ('development' == app.get('env')) {
	  app.use(express.errorHandler());
	}	
	
	
	/// Open an maintain a connection to the database. Do not forget to always close 
	/// the connection afterwards. 
	//conn.connect();
	
	/// This is a call to the function that creates the database schema. It is called
	/// first when the program starts, drops all tables in the database and re-create 
	/// them again.
	
	// all environments
	app.configure(function(){
	
	    /// This code handles the 404 Error. We might want to refactor this later and 
	    /// maybe isolate it in a separate module or somewhere else in the code where 
	    /// it makes most sense. 
	    app.use(function(req, res, next){
	        res.status(404);
	
	        // respond with html page
	        if (req.accepts('html')) {
	            res.render('error', {
	                title: '404 | Page Not Found',
	                code: 404
	            });
	            return;
	        }
	
	        // respond with json
	        if (req.accepts('json')) {
	            res.send({ error: 'Not found' });
	            return;
	        }
	
	        // default to plain-text. send()
	        res.type('txt').send('Not found');
	    });
	
	    /// This code handles the 500 Error. It should probably be called when the 
	    /// server encounters an error and not here. I am not sure if it is even 
	    /// going to be triggered from here! Again, refactoring work left for later.
	    app.use(function(req, res, next){
	        sendInternalServerError(req, res);
	    });
	});
	
	app.get('/', checkAuth, appendConn, routes.index);
	app.get('/feed', checkAuth, appendConn, routes.index);
	
	//app.get('/users/search', checkAuth, appendConn, user.search);
	app.get('/users/new', checkAuthInverse, user.new);
	app.post('/users/create', appendConn, user.create);
	app.get('/users/:id', checkAuth, appendConn, user.checkIfFollows, user.show);
	app.get('/users/:id/follow', checkAuth, appendConn, user.follow);
	app.get('/users/:id/unfollow', checkAuth, appendConn, user.unfollow);
	
	app.get('/sessions/new', checkAuthInverse, session.new);
	app.post('/sessions/create', appendConn, session.create);
	app.get('/sessions/end', session.end);
	
	app.get('/photos/new', checkAuth, photo.new);
	app.post('/photos/create', checkAuth, appendConn, photo.addPhotoToTable, photo.insertPhotoPathToTable, photo.populateStreamTable, photo.create);
	app.get('/photos/thumbnail/:id.:ext', checkAuth,  photo.showThumbnail);
	app.get('/photos/thumbnail/shared/:id.:ext', checkAuth,  photo.showThumbnail);
	app.get('/photos/thumbnail/home/courses/s513/w2014/pics/:id.:ext', checkAuth,  photo.showThumbnail);
	app.get('/photos/:id.:ext', checkAuth, photo.show);
	app.get('/photos/shared/:id.:ext', checkAuth, photo.show);
	app.get('/photos/home/courses/s513/w2014/pics/:id.:ext', checkAuth, photo.show);
	app.get('/photos/share/:pid', checkAuth, appendConn, photo.addPhotoToTableShared, photo.populateStreamTableShared, photo.populateStreamTable, photo.redirect);
	
	app.get('/bulk/clear', appendConn, bulk.clear);
	app.post('/bulk/users', appendConn, bulk.users);
	app.post('/bulk/streams', appendConn, bulk.streams);
	app.get('/bulk/testusers', appendConn, bulk.testUsers);
	app.get('/bulk/testphotos', appendConn, bulk.testPhotos);
	app.get('/bulk/show', appendConn, bulk.logEverything);
	
	

    // Code to run if we're in the master process
if (cluster.isMaster) {

    // Count the machine's CPUs
    var cpuCount = require('os').cpus().length;

    // Create a worker for each CPU
    for (var i = 0; i < cpuCount; i += 1) {
        cluster.fork();
    }

// Code to run if we're in a worker process
} else {
    	http.createServer(app).listen(app.get('port'), function(){
	  console.log('Express server listening on port ' + app.get('port'));
	});
}

function sendInternalServerError(req, res){
    // Reply with ERROR 500
    res.status(500);
    // respond with html page
    if (req.accepts('html')) {
    res.render('error', {
        title: '500 | Internal Server Error',
        code: 500
    });
    return;
    }

    // respond with json
    if (req.accepts('json')) {
        res.send({ error: 'Internal Server Error' });
        return;
    }

    // default to plain-text. send()
    res.type('txt').send('Internal Server Error');
    return;
}

function checkAuth(req, res, next) {
       if(req.session.loggedin == "" || req.session.loggedin == undefined){
	    console.log("ERROR: NOT LOGGED IN");
           /// redirect the user to the login page, including the address of 
           /// of the page they were attempting to view in order to redirect 
           /// to it after successful login
           res.redirect('/sessions/new?redir='+req.url, 302);
       }
	else{
           req.username = req.session.loggedin;
           req.myuid = req.session.userid;
	    req.name = req.session.name;
           next();       
	}
}

function checkAuthInverse(req, res, next) {
	console.log("CHECKING INVERSE AUTH");
	console.log(req.session);

       if(req.session.loggedin == "" || req.session.loggedin == undefined){
           next();
       }
	else{
	    res.redirect('/',302);       
	}
}

function appendConn(req, res, next) {
    req.conn = conn;
    next();
}