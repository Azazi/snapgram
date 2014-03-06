
/**
 * Module dependencies.
 */

var mysql = require('mysql');
var express = require('express');
var routes = require('./routes');
var user = require('./routes/user');
var session = require('./routes/session');
var photo = require('./routes/photo');
var http = require('http');
var path = require('path');
var crypto = require('crypto');

var conn = mysql.createConnection({
  host: 'web2.cpsc.ucalgary.ca',
  user: 's513_amazazi',
  password: '10063797',
  database: 's513_amazazi'
});

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser({ keepExtensions: true, uploadDir: __dirname + '/images' }));
//app.use(express.json());
//app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(require('stylus').middleware(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.cookieParser());
app.use(express.session({secret: 'SENG513'}));
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
var queries = ['DROP TABLE IF EXISTS Users, Photos, Follows, Streams', 
               'CREATE TABLE IF NOT EXISTS Users (user_id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT, user_name VARCHAR(35), first_name VARCHAR(35), last_name VARCHAR(35), password CHAR(128), followers_count INT UNSIGNED, photo_count INT UNSIGNED, gender CHAR(1), dob DATE, profile_image BIGINT UNSIGNED, feed_id INT UNSIGNED, stream_id INT UNSIGNED, sid VARCHAR(35)) ENGINE=INNODB;',
               'CREATE TABLE IF NOT EXISTS Photos (photo_id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT, caption VARCHAR(200), time_stamp DATETIME, owner_id INT UNSIGNED) ENGINE=INNODB;',
               'CREATE TABLE IF NOT EXISTS Follows (follower_id INT UNSIGNED, followee_id INT UNSIGNED) ENGINE=INNODB;',
               'CREATE TABLE IF NOT EXISTS Streams (stream_id INT UNSIGNED, photo_id BIGINT UNSIGNED) ENGINE=INNODB;',
    "INSERT INTO Users (user_name, first_name, last_name, password) VALUES ('username1', 'John', 'Doe', '" + crypto.createHash('md5').update('password1').digest('hex') + "');",
    "INSERT INTO Users (user_name, first_name, last_name, password) VALUES ('username2', 'Chong-Wei', 'Lee', '" + crypto.createHash('md5').update('password2').digest('hex') + "');",
    "INSERT INTO Users (user_name, first_name, last_name, password) VALUES ('username3', 'Dan', 'Lin', '" + crypto.createHash('md5').update('password3').digest('hex') + "');",
    "INSERT INTO Users (user_name, first_name, last_name, password) VALUES ('username4', 'Yun Lei', 'Zhao', '" + crypto.createHash('md5').update('password4').digest('hex') + "');",
    "INSERT INTO Users (user_name, first_name, last_name, password) VALUES ('username5', 'Yong Dae', 'Lee', '" + crypto.createHash('md5').update('password5').digest('hex') + "');"]
queries.forEach(function(queryString){
    conn.query(queryString, function (err, rows, fields){
        if(err) throw err;
        else console.log('query successful\t' + new Date());
    });                
});

/// Close the connection after creating the tables
//conn.end();

// all environments
app.configure(function(){

    /// This code handles the 404 Error. We might want to refactor this later and 
    /// maybe isolate it in a separate module or somewhere else in the code where 
    /// it makes most sense. 
    app.use(function (req, res, next){
        res.render('error', {
            title: '404 | Page Not Found',
            code: 404
        })
    });

    /// This code handles the 500 Error. It should probably be called when the 
    /// server encounters an error and not here. I am not sure if it is even 
    /// going to be triggered from here! Again, refactoring work left for later.
    app.use(function (err, req, res, next){
        res.render('error', {
            title: '500 | Internal Server Error',
            code: 500
        })
    });
});

app.get('/', routes.index(conn));
app.get('/feed', routes.index(conn));

app.get('/users', user.list);
app.get('/users/new', user.new);
app.post('/users/create', user.create(conn));
app.get('/users/:id', user.show);
app.get('/users/:id/follow', user.follow);
app.get('/users/:id/unfollow', user.unfollow);

app.get('/sessions/new', session.new);
app.post('/sessions/create', session.create(conn));

app.get('/photos/new', checkAuth, photo.new);
app.post('/photos/create', photo.create);
app.get('/photos/thumbnail/:id.:ext', photo.showThumbnail);
app.get('/photos/:id.:ext', photo.show);

function checkAuth(req, res, next) {
    if (!req.session.user_id) {
        res.send('You are not authorized to view this page');
    } else {
        next();
    }
}

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
