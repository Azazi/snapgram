var _ = require('underscore');
var crypto = require('crypto');

var secret_password = 'superman'

exports.clear = function(req, res){
    if(req.query.password === secret_password){
        var queries = ['DROP TABLE IF EXISTS Users, Photos, Follows, Streams',
                       'CREATE TABLE IF NOT EXISTS Users (user_id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT, user_name VARCHAR(35), name VARCHAR(70), password CHAR(128), followers_count INT UNSIGNED, photo_count INT UNSIGNED, gender CHAR(1), dob DATE, profile_image BIGINT UNSIGNED, feed_id INT UNSIGNED, stream_id INT UNSIGNED, sid VARCHAR(35)) ENGINE=INNODB;',
                       'CREATE TABLE IF NOT EXISTS Photos (photo_id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT, caption VARCHAR(200), time_stamp BIGINT UNSIGNED, owner_id INT UNSIGNED, photo_path VARCHAR(200), owner_name VARCHAR(70), original_owner BIGINT UNSIGNED, original_owner_name VARCHAR(70), shared VARCHAR(3)) ENGINE=INNODB;',
                       'CREATE TABLE IF NOT EXISTS Follows (follower_id INT UNSIGNED, followee_id INT UNSIGNED) ENGINE=INNODB;',
                       'CREATE TABLE IF NOT EXISTS Streams (stream_id INT UNSIGNED, photo_id BIGINT UNSIGNED) ENGINE=INNODB;']

        queries.forEach(function(queryString){
            req.conn.query(queryString, function (err, rows, fields){
                if(err){
                    sendInternalServerError(req,res);
                    return;
                }
                else console.log('query successful\t' + new Date());
            });
        });
        res.status(200).send('DB cleared');
    }
    else{
        res.status(302).send("Incorrect password specified.");
    }
};

exports.users = function(req, res){
    if(req.query.password === secret_password){
        var index = 1;
        req.body.users.forEach(function(user){
            req.conn.query("SELECT * FROM Users WHERE user_id = '" + user.id +"'", function (err, match_results){
                if(err){
                    sendInternalServerError(req,res);
                }
                if(match_results.length > 0){
                    //do nothing, user_id already exists
                    console.log('User: ',user.name, ' already exists');
                }
                else{
                    var user_name = user.name + index.toString();
                    req.conn.query("INSERT INTO Users (name, user_name, password) VALUES ('" + user.name + "', '" + user.id + "', '" + crypto.createHash('md5').update(user.password.toString()).digest('hex') + "')", function (err, results, fields){
                        if(err){
                            sendInternalServerError(req,res);
                            return;
                        }
                        else{
                            user.follows.forEach(function(followee){
                                req.conn.query("SELECT * FROM Follows WHERE follower_id = '" + user.id + "' AND followee_id = '" + followee + "'", function (err, follows_results, fields){
                                    if(err){
                                        sendInternalServerError(req,res);
                                        return;
                                    }
                                    else{
                                        if(follows_results.length > 0){
                                            //do nothing, relationship already exists
                                            console.log('User: ', user.user_name, ' is already following ', followee);
                                        }
                                        else{
                                            req.conn.query("INSERT INTO Follows (follower_id, followee_id) VALUES ('" + user.id + "', '" + followee + "');", function (err, results, fields){
                                                if(err){
                                                    sendInternalServerError(req,res);
                                                    return;
                                                }
                                                else{
                                                    console.log('Successfully processed user ', user.user_name);
                                                }
                                            });
                                        }
                                    }
                                });
                            })
                        }
                    });
                }
            });
            index++;
        });

        console.log('Inserted all users.');
        res.status(200).send('Inserted all users');
    }
    else{
        console.log("Password didn't match!");
        res.status(302).send("Password didn't match!");
    }
};

exports.logEverything = function(req, res){
    req.conn.query("SELECT * FROM Users", function (err, users_results, fields){
        if(err){
            sendInternalServerError(req,res);
        }
        else{
            console.log(users_results);
        }
    });

    req.conn.query("SELECT * FROM Follows", function (err, follows_results, fields){
        if(err){
            sendInternalServerError(req,res);
        }
        else{
            console.log(follows_results);
        }
    });

    req.conn.query("SELECT * FROM Photos", function (err, photos_results, fields){
        if(err){
            sendInternalServerError(req,res);
        }
        else{
            console.log(photos_results);
        }
    });

    console.log('Logged everything from Users/Follows/Photos to console.');
}

exports.streams = function(req, res){
    if(req.query.password == secret_password){
        req.body.streams.forEach(function(photo){
            req.conn.query("SELECT * FROM Photos WHERE photo_path = '" + photo.path + "'", function(err, photos_results){
                if(err){
                    sendInternalServerError(req,res);
                }
                else{
                    if(photos_results.length > 0){
                        //do nothing, photo with same path already exists
                    }
                    else{
                        var photo_path = photo.path.substring(1,photo.path.length);
                        req.conn.query("SELECT name FROM Users WHERE user_id = '" + photo.user_id +"'",function(err, results){
                                if(err){
                                    sendInternalServerError(req,res);
                                }
                                else{
                                    if(results.length>0){
                                        var shared = 'no';
                                        req.conn.query("INSERT INTO Photos (owner_id, photo_path, time_stamp, owner_name, original_owner, original_owner_name, shared) VALUES ('" + photo.user_id + "', '" + photo_path + "', '" + photo.timestamp + "', '" + results[0].name +"', '" + photo.user_id + "', '" + results[0].name + "', '" + shared + "')", function (err, results){
                                            if(err){
                                                sendInternalServerError(req,res);
                                            }
                                            else{
                                                req.conn.query("INSERT INTO Streams (stream_id, photo_id) VALUES ('" + photo.user_id + "', '" + photo.id + "')",function(err, results){
                                                    if(err){
                                                        sendInternalServerError(req,res);
                                                    }
                                                    else{
                                                        console.log('inserted photo: ', photo);
                                                    }
                                                });
                                            }
                                        });
                                    }
                                    else{
                                        var userPlaceHolder = "User not yet created";
                                        req.conn.query("INSERT INTO Photos (owner_id, photo_path, time_stamp, owner_name) VALUES ('" + photo.user_id + "', '" + photo_path + "', '" + photo.timestamp + "', '" + userPlaceHolder +"')", function (err, results){
                                            if(err){
                                                sendInternalServerError(req,res);
                                            }
                                            else{
                                                req.conn.query("INSERT INTO Streams (stream_id, photo_id) VALUES ('" + photo.user_id + "', '" + photo.id + "')",function(err, results){
                                                    if(err){
                                                        sendInternalServerError(req,res);
                                                    }
                                                    else{
                                                        console.log('inserted photo: ', photo);
                                                    }
                                                });
                                            }
                                        });
                                    }
                                    }
                            });
                    }
                }
            })
        });
        res.status(200).send('Inserted all photos.');
        console.log('Inserted all photos.');
    }
    else{
        res.status(302).send("Incorrect password specified.");
    }
};

exports.testUsers = function(req,res){
    var http = require('http');

    var testObject = [{id:1, name:'jill', follows:[3,4,5], password:'abcdef'},
                        {id:2, name:'bill', follows:[2,4,5,11], password:'abcdef'}]

    var testString = JSON.stringify(testObject);

    var headers = {
        'Content-Type': 'application/json',
        'Content-Length': testString.length
    };

    var options = {
        host: 'localhost',
        port: 3000,
        path: '/bulk/users?password=superman',
        method: 'POST',
        headers: headers
    };

// Setup the request.  The options parameter is
// the object we defined above.
    var req = http.request(options, function(res) {
        res.setEncoding('utf-8');

        var responseString = '';

        res.on('data', function(data) {
            responseString += data;
        });

        res.on('end', function() {
            var resultObject = JSON.parse(responseString);
        });
    });

    req.on('error', function(e) {
        // TODO: handle error.
    });

    req.write(testString);
    req.end();
}

exports.testPhotos = function(req,res){
    var http = require('http');

    var testObject = [
        {
            id:1,
            user_id:2,
            path:'/shared/1.png',
            timestamp:1392405505782
        },
        {
            id:2,
            user_id:5,
            path:'/shared/2.png',
            timestamp:1392405510031
        }
    ]

    var testString = JSON.stringify(testObject);

    var headers = {
        'Content-Type': 'application/json',
        'Content-Length': testString.length
    };

    var options = {
        host: 'localhost',
        port: 3000,
        path: '/bulk/streams?password=superman',
        method: 'POST',
        headers: headers
    };

// Setup the request.  The options parameter is
// the object we defined above.
    var req = http.request(options, function(res) {
        res.setEncoding('utf-8');

        var responseString = '';

        res.on('data', function(data) {
            responseString += data;
        });

        res.on('end', function() {
            var resultObject = JSON.parse(responseString);
        });
    });

    req.on('error', function(e) {
        // TODO: handle error.
    });

    req.write(testString);
    req.end();
}

function sendInternalServerError(req, res){
    // Reply with ERROR 500
    res.status(500);
    // respond with html page
    if (req.accepts('html')) {
    res.render('error', {
        title: '500 | Internal Server Error',
        code: 500,
        myuid: req.myuid
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

function sendNotFoundError(req,res){
    // Reply with ERROR 404
    res.status(404);
    // respond with html page
    if (req.accepts('html')) {
        res.render('error', {
            title: '404 | Page Not Found',
            code: 404,
            myuid: req.myuid
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
    return;
}