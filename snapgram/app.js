
/**
 * Module dependencies.
 */

var mysql = require('mysql');
var express = require('express');
var routes = require('./routes');
var user = require('./routes/user');
var session = require('./routes/session');
var bulk = require('./routes/bulk');
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
app.set('port', 8550);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.set('view options', { locals: { scripts: ['jquery.js'] } });

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
               'CREATE TABLE IF NOT EXISTS Users (user_id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT, user_name VARCHAR(35), name VARCHAR(70), password CHAR(128), followers_count INT UNSIGNED, photo_count INT UNSIGNED, gender CHAR(1), dob DATE, profile_image BIGINT UNSIGNED, feed_id INT UNSIGNED, stream_id INT UNSIGNED, sid VARCHAR(35)) ENGINE=INNODB;',
               'CREATE TABLE IF NOT EXISTS Photos (photo_id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT, caption VARCHAR(200), time_stamp BIGINT UNSIGNED, owner_id INT UNSIGNED, photo_path VARCHAR(200), owner_name VARCHAR(70), original_owner BIGINT UNSIGNED) ENGINE=INNODB;',
               'CREATE TABLE IF NOT EXISTS Follows (follower_id INT UNSIGNED, followee_id INT UNSIGNED) ENGINE=INNODB;',
               'CREATE TABLE IF NOT EXISTS Streams (stream_id INT UNSIGNED, photo_id BIGINT UNSIGNED) ENGINE=INNODB;',
    "INSERT INTO Users (user_name, name, password) VALUES ('username1', 'John Doe', '" + crypto.createHash('md5').update('password1').digest('hex') + "');",
    "INSERT INTO Users (user_name, name, password) VALUES ('username2', 'Chong-Wei Lee', '" + crypto.createHash('md5').update('password2').digest('hex') + "');",
    "INSERT INTO Users (user_name, name, password) VALUES ('username3', 'Dan Lin', '" + crypto.createHash('md5').update('password3').digest('hex') + "');",
    "INSERT INTO Users (user_name, name, password) VALUES ('username4', 'Yun Lei Zhao', '" + crypto.createHash('md5').update('password4').digest('hex') + "');",
    "INSERT INTO Users (user_name, name, password) VALUES ('username5', 'Yong Dae Lee', '" + crypto.createHash('md5').update('password5').digest('hex') + "');",
    "INSERT INTO Follows (follower_id, followee_id) VALUES ('0', '1')",
    "INSERT INTO Follows (follower_id, followee_id) VALUES ('1', '3')",
    "INSERT INTO Follows (follower_id, followee_id) VALUES ('1', '4')",
    "INSERT INTO Follows (follower_id, followee_id) VALUES ('3', '1')",
    "INSERT INTO Follows (follower_id, followee_id) VALUES ('3', '4')",
    "INSERT INTO Follows (follower_id, followee_id) VALUES ('5', '1')",
    "INSERT INTO Follows (follower_id, followee_id) VALUES ('4', '1')",
    "INSERT INTO Follows (follower_id, followee_id) VALUES ('4', '2')",
    "INSERT INTO Follows (follower_id, followee_id) VALUES ('4', '3')",
    "INSERT INTO Follows (follower_id, followee_id) VALUES ('4', '5')",
    "INSERT INTO Follows (follower_id, followee_id) VALUES ('1', '1')",
    "INSERT INTO Follows (follower_id, followee_id) VALUES ('2', '2')",
    "INSERT INTO Follows (follower_id, followee_id) VALUES ('3', '3')",
    "INSERT INTO Follows (follower_id, followee_id) VALUES ('4', '4')",
    "INSERT INTO Follows (follower_id, followee_id) VALUES ('5', '5')"]
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

app.get('/', appendConn, routes.index);
app.get('/feed', checkAuth, appendConn, routes.index);

//app.get('/users', user.list);
app.get('/users/new', checkAuthInverse, user.new);
app.post('/users/create', appendConn, user.create);
app.get('/users/:id', checkAuth, appendConn, user.checkIfFollows, user.show);
app.get('/users/:id/follow', checkAuth, appendConn, user.follow);
app.get('/users/:id/unfollow', checkAuth, appendConn, user.unfollow);

app.get('/sessions/new', checkAuthInverse, session.new);
app.post('/sessions/create', appendConn, session.create);
app.get('/sessions/end', session.end);

app.get('/photos/new', checkAuth, photo.new);
app.post('/photos/create', checkAuth, appendConn, photo.getUserIDFromSID, photo.addPhotoToTable, photo.getPhotoID, photo.insertPhotoPathToTable, photo.populateStreamTable, photo.create);
app.get('/photos/thumbnail/:id.:ext', checkAuth,  photo.showThumbnail);
app.get('/photos/:id.:ext', checkAuth, photo.show);
app.get('/photos/share/:pid', checkAuth, appendConn, photo.getUserIDFromSID, photo.addPhotoToTableShared, photo.getPhotoID, photo.populateStreamTableShared, photo.populateStreamTable, routes.index);

app.get('/bulk/clear', appendConn, bulk.clear);
app.post('/bulk/users', appendConn, bulk.users);
app.post('/bulk/streams', appendConn, bulk.streams);
app.get('/bulk/testusers', appendConn, bulk.testUsers);
app.get('/bulk/testphotos', appendConn, bulk.testPhotos);
app.get('/bulk/show', appendConn, bulk.logEverything);

function checkAuth(req, res, next) {
    conn.query("SELECT * FROM Users WHERE sid = '" + req.cookies.sid + "'", function (err, sids, fields){
        if(err){
            sendInternalServerError(req, res);
        }
        else{
            if(sids.length <= 0){
                /// redirect the user to the login page, including the address of 
                /// of the page they were attempting to view in order to redirect 
                /// to it after successful login
                res.redirect('/sessions/new?redir='+req.url, 302);
            }
            else{
                console.log(sids[0]);
                req.username = sids[0].user_name;
                req.myuid = sids[0].user_id;
                next();
            }
        }
    });
}

function checkAuthInverse(req, res, next) {
    if(req.cookies.sid){
        conn.query("SELECT * FROM Users WHERE sid = '" + req.cookies.sid + "'", function (err, sids, fields){
            if(err){
                sendInternalServerError(req, res);
            }
            else{
                if(sids.length > 0){
                    //logged in already
                    res.redirect('/',302);
                }
                else{
                    next();
                }
            }
        });
    }
    else{
        next();
    }

}

function appendConn(req, res, next) {
    req.conn = conn;
    next();
}

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

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