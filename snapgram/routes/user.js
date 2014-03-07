var _ = require('underscore');
var crypto = require('crypto');

exports.new = function(req, res){
    res.render('register', {
        title: 'Join Snapgram'
    });
};

exports.create = function(req, res){
    var exists = false;

    if(req.body.username === '' || req.body.password === '' || req.body.name === ''){
        res.status(302);
        res.render('register', {
            title: 'Join Snapgram',
            error: 'input error'
        });
    }
    else{
        req.conn.query(
            'SELECT user_name FROM Users;',
            function(err,usernames,fields){
                if(err){
                    console.log(err);

                    /// This code handles the 500 Error. It should probably be called when the
                    /// server encounters an error and not here. I am not sure if it is even
                    /// going to be triggered from here! Again, refactoring work left for later.
                    app.use(function (err, req, res, next){
                            res.send('500: Internal Server Error', 500);
                    });

                    return;
                }
                _.each(usernames, function(user){
                    console.log(user.user_name);
                    if(user.user_name == req.body.username){
                        console.log("ERROR: USERNAME ALREADY EXISTS");
                        exists = true;
                    }
                })

                if(exists){
                    res.send("Username already exists, please select another username");
                }
                else{
                    var hash = crypto.createHash('md5').update(new Date() + req.body.username).digest('hex');
                    req.conn.query("INSERT INTO Users (user_name, name, password, sid) " +
                        "VALUES ('" + req.body.username + "', '" + req.body.name + "', '" + crypto.createHash('md5').update(req.body.password.toString()).digest('hex') + "', '" + hash + "')", function (err, rows, fields){
                        if(err) throw err;
                        else console.log('query successful\t' + new Date());
                    });
                    req.session.user_id = req.body.username;
                    res.cookie("sid", hash).redirect("/");

                    req.conn.query("SELECT user_id FROM Users WHERE user_name = '" + req.body.username + "'", function (err, user_ids, fields){
                        if(err) throw err;
                        else{
                            req.conn.query("INSERT INTO Follows (follower_id, followee_id) VALUES ('" + user_ids[0] + "', '" + user_ids[0].user_id + "');", function (err, results, fields){
                                if(err) throw err;
                            });
                        }
                    });
                }
            }
        );
    }
};

exports.show = function(req, res){
    req.conn.query("SELECT * FROM Users WHERE user_id = '" + req.params.id + "'", function (err, results, fields){
        if(err) throw err;
        else{
            if(results.length == 0){
                res.send("User does not exist.");
                return;
            }
        }
    });
    console.log("USER DOES EXIST");
    req.conn.query("SELECT * FROM Photos WHERE owner_id = '" + req.params.id + "'", function (err, photos, fields){
        if(err) throw err;
        else{
            console.log(photos);
            res.send(photos);
            //send photos to view for user/:id and render them
        }
    });
};

exports.follow = function(req, res){
    req.conn.query("SELECT user_id FROM Users WHERE sid = '" + req.cookies.sid + "'", function (err, user_ids, fields){
        if(err) throw err;
        else{
            req.conn.query("SELECT * FROM Follows WHERE follower_id = '" + user_ids[0].user_id + "' AND followee_id = '" + req.params.id + "'", function (err, follows_results, fields){
                if(err) throw err;
                else{
                    if(follows_results.length > 0){
                        //do nothing, relationship already exists
                        res.redirect('/');
                    }
                    else{
                        req.conn.query("INSERT INTO Follows (follower_id, followee_id) VALUES ('" + user_ids[0].user_id + "', '" + req.params.id + "');", function (err, results, fields){
                            if(err) throw err;
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
        if(err) throw err;
        else{
            req.conn.query("SELECT * FROM Follows WHERE follower_id = '" + user_ids[0].user_id + "' AND followee_id = '" + req.params.id + "'", function (err, follows_results, fields){
                if(err) throw err;
                else{
                    if(follows_results.length <= 0){
                        //do nothing, relationship never existed!
                        res.redirect('/');
                    }
                    else{
                        req.conn.query("DELETE FROM Follows WHERE follower_id = '" + user_ids[0].user_id + "' and followee_id = '" + req.params.id + "'", function (err, results, fields){
                            if(err) throw err;
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