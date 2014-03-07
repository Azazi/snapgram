var _ = require('underscore');
var crypto = require('crypto');

var secret_password = 'superman'

exports.clear = function(req, res){
    if(req.query.password == secret_password){
        var queries = ['DROP TABLE IF EXISTS Users, Photos, Follows, Streams',
            'CREATE TABLE IF NOT EXISTS Users (user_id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT, user_name VARCHAR(35), name VARCHAR(70), password CHAR(128), followers_count INT UNSIGNED, photo_count INT UNSIGNED, gender CHAR(1), dob DATE, profile_image BIGINT UNSIGNED, feed_id INT UNSIGNED, stream_id INT UNSIGNED, sid VARCHAR(35)) ENGINE=INNODB;',
            'CREATE TABLE IF NOT EXISTS Photos (photo_id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT, caption VARCHAR(200), time_stamp BIGINT UNSIGNED, owner_id INT UNSIGNED, photo_path VARCHAR(200), original_owner BIGINT UNSIGNED) ENGINE=INNODB;',
            'CREATE TABLE IF NOT EXISTS Follows (follower_id INT UNSIGNED, followee_id INT UNSIGNED) ENGINE=INNODB;',
            'CREATE TABLE IF NOT EXISTS Streams (stream_id INT UNSIGNED, photo_id BIGINT UNSIGNED) ENGINE=INNODB;']

        queries.forEach(function(queryString){
            req.conn.query(queryString, function (err, rows, fields){
                if(err) throw err;
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
    if(req.query.password == secret_password){
        req.body.forEach(function(user){
            req.conn.query("SELECT * FROM Users WHERE user_id = '" + user.id +"'", function (err, match_results){
                if(match_results.length > 0){
                    //do nothing, user_id already exists
                }
                else{
                    req.conn.query("INSERT INTO Users (name, user_name, password) VALUES ('" + user.name + "', '" + user.name + "', '" + crypto.createHash('md5').update(user.password.toString()).digest('hex') + "')", function (err, results, fields){
                        if(err) throw err;
                        else{
                            user.follows.forEach(function(followee){
                                req.conn.query("SELECT * FROM Follows WHERE follower_id = '" + user.id + "' AND followee_id = '" + followee + "'", function (err, follows_results, fields){
                                    if(err) throw err;
                                    else{
                                        if(follows_results.length > 0){
                                            //do nothing, relationship already exists
                                        }
                                        else{
                                            req.conn.query("INSERT INTO Follows (follower_id, followee_id) VALUES ('" + user.id + "', '" + followee + "');", function (err, results, fields){
                                                if(err) throw err;
                                                else{
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
        });

        console.log('Inserted all users.');
    }
    else{
        console.log("Password didn't match!");
    }
};

exports.logEverything = function(req, res){
    req.conn.query("SELECT * FROM Users", function (err, users_results, fields){
        if(err) throw err;
        else{
            console.log(users_results);
        }
    });

    req.conn.query("SELECT * FROM Follows", function (err, follows_results, fields){
        if(err) throw err;
        else{
            console.log(follows_results);
        }
    });

    req.conn.query("SELECT * FROM Photos", function (err, photos_results, fields){
        if(err) throw err;
        else{
            console.log(photos_results);
        }
    });

    console.log('Logged everything from Users/Follows/Photos to console.');
}

exports.streams = function(req, res){
    if(req.query.password == secret_password){
        req.body.forEach(function(photo){
            req.conn.query("SELECT * FROM Photos WHERE photo_path = '" + photo.path + "'", function(err, photos_results){
                if(err) throw err;
                else{
                    if(photos_results.length > 0){
                        //do nothing, photo with same path already exists
                    }
                    else{
                        req.conn.query("INSERT INTO Photos (owner_id, photo_path, time_stamp) VALUES ('" + photo.user_id + "', '" + photo.path + "', '" + photo.timestamp + "')", function (err, results){
                            if(err) throw err;
                            else{
                            }
                        });
                    }
                }
            })
        });

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