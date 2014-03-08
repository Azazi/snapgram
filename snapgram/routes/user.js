var _ = require('underscore');
var crypto = require('crypto');

exports.new = function(req, res){
    res.status(200);
    res.render('register', {
        title: 'Join Snapgram'
    });
};

exports.create = function(req, res){
    var exists = false;

    if(req.body.username === '' || req.body.password === '' || req.body.name === ''){
        var errorMsg;
        if(req.body.username === '')
            errorMsg = "username cannot be empty";
        else if(req.body.password === '')
            errorMsg = "password cannot be empty";
        else
            errorMsg = "name cannot be empty";
        res.status(302);
        res.render('register', {
            title: 'Join Snapgram',
            error: errorMsg
        });
    }
    else{
        req.conn.query(
            'SELECT user_name FROM Users;',
            function(err,usernames,fields){
                if(err){
                    console.log(err);
                    sendInternalServerError(req, res);
                }
                _.each(usernames, function(user){
                    console.log(user.user_name);
                    if(user.user_name == req.body.username){
                        console.log("ERROR: USERNAME ALREADY EXISTS");
                        exists = true;
                    }
                })

                if(exists){
                    var errorMsg = 'username already exists';
                    res.status(302);
                    res.render('register', {
                        title: 'Join Snapgram',
                        error: errorMsg
                    });
                }
                else{
                    var hash = crypto.createHash('md5').update(new Date() + req.body.username).digest('hex');
                    req.conn.query("INSERT INTO Users (user_name, name, password, sid) " +
                        "VALUES ('" + req.body.username + "', '" + req.body.name + "', '" + crypto.createHash('md5').update(req.body.password.toString()).digest('hex') + "', '" + hash + "')", function (err, rows, fields){
                        if(err){
                            sendInternalServerError(req, res);
                        }
                        else console.log('query successful\t' + new Date());
                    });
                    req.session.user_id = req.body.username;
                    res.cookie("sid", hash).redirect("/feed", 302); 

                    req.conn.query("SELECT user_id FROM Users WHERE user_name = '" + req.body.username + "'", function (err, user_ids, fields){
                        if(err){
                            sendInternalServerError(req, res);
                        }
                        else{
                            req.conn.query("INSERT INTO Follows (follower_id, followee_id) VALUES ('" + user_ids[0].user_id + "', '" + user_ids[0].user_id + "');", function (err, results, fields){
                                if(err){
                                    sendInternalServerError(req, res);
                                }
                            });
                        }
                    });
                }
            }
        );
    }
};

exports.checkIfFollows = function(req, res, next){
    req.conn.query("SELECT * FROM Follows WHERE follower_id = '" + req.myuid + "' AND followee_id = '" + req.params.id + "'", function (err, results, fields){
        if(err){
            sendInternalServerError(req, res);
            return;
        }
        else{
            if(results.length == 0){
                req.follows = false;
            }
            else{
                req.follows = true;
            }
            next()
        }
    });
}

exports.show = function(req, res){
    var uname;
    req.conn.query("SELECT * FROM Users WHERE user_id = '" + req.params.id + "'", function (err, results, fields){
        if(err){
            sendInternalServerError(req, res);
            return;
        }
        else{
            if(results.length == 0){
                sendNotFoundError(req,res);
                return;
            }
            uname = results[0].user_name;
        }
    });
    console.log("USER DOES EXIST");
    req.conn.query("SELECT * FROM Photos WHERE owner_id = '" + req.params.id + "'", function (err, photos, fields){
        if(err){
            sendInternalServerError(req, res);
        }
        else{
            console.log(photos);
            res.status(200);
            res.render('user', {
                title: 'User Stream',
                logged_in: true,
                sid: req.cookies.sid,
                user_name: uname,
                stream: photos,
                page: req.query.page,
                follows: req.follows,
                uid: req.params.id,
                myuid: req.myuid
            });
            //send photos to view for user/:id and render them
        }
    });
};

exports.follow = function(req, res){
    req.conn.query("SELECT user_id FROM Users WHERE sid = '" + req.cookies.sid + "'", function (err, user_ids, fields){
        if(err){
            sendInternalServerError(req, res);
        }
        else{
            req.conn.query("SELECT * FROM Follows WHERE follower_id = '" + user_ids[0].user_id + "' AND followee_id = '" + req.params.id + "'", function (err, follows_results, fields){
                if(err){
                    sendInternalServerError(req, res);
                }
                else{
                    if(follows_results.length > 0){
                        //do nothing, relationship already exists
                        res.redirect('/');
                    }
                    else{
                        req.conn.query("INSERT INTO Follows (follower_id, followee_id) VALUES ('" + user_ids[0].user_id + "', '" + req.params.id + "');", function (err, results, fields){
                            if(err){
                                sendInternalServerError(req, res);
                            }
                            else{
                                console.log(user_ids[0].user_id + " is now following " + req.params.id);
                                res.redirect('/');
                            }
                        });
                    }
                }
            });
        }
    });
};

exports.unfollow = function(req, res){
    req.conn.query("SELECT user_id FROM Users WHERE sid = '" + req.cookies.sid + "'", function (err, user_ids, fields){
        if(err){
            sendInternalServerError(req, res);
        }
        else{
            req.conn.query("SELECT * FROM Follows WHERE follower_id = '" + user_ids[0].user_id + "' AND followee_id = '" + req.params.id + "'", function (err, follows_results, fields){
                if(err){
                    sendInternalServerError(req, res);
                }
                else{
                    if(follows_results.length <= 0){
                        //do nothing, relationship never existed!
                        res.redirect('/');
                    }
                    else{
                        req.conn.query("DELETE FROM Follows WHERE follower_id = '" + user_ids[0].user_id + "' and followee_id = '" + req.params.id + "'", function (err, results, fields){
                            if(err){
                                sendInternalServerError(req, res);
                            }
                            else{
                                console.log(user_ids[0].user_id + " has unfollowed " + req.params.id);
                                res.redirect('/');
                            }
                        });
                    }
                }
            });
        }
    });
};

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

function sendNotFoundError(req,res){
    // Reply with ERROR 404
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
    return;
}