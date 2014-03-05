var _ = require('underscore');
var crypto = require('crypto');
/*
 * GET users listing.
 */

exports.list = function(req, res){
  res.send("respond with a resource");
};

exports.new = function(req, res){
        res.sendfile('./public/registrationform.html');
};

exports.create = function(conn){
    return function(req, res){
        var exists = false;
        conn.query(
            'SELECT user_name, password FROM Users;',
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
                    conn.query("INSERT INTO Users (user_name, first_name, last_name, password, sid) " +
                        "VALUES ('" + req.body.username + "', '" + req.body.firstname + "', '" + req.body.lastname + "', '" + crypto.createHash('md5').update(req.body.password.toString()).digest('hex') + "', '" + hash + "')", function (err, rows, fields){
                        if(err) throw err;
                        else console.log('query successful\t' + new Date());
                    });
                    res.cookie.username = req.body.username;
                    res.cookie("sid", hash).send('<p>Cookie Set: <a href="/users/1">View Here</a></p>');

                    conn.query("SELECT sid FROM Users WHERE user_name = '" + req.body.username + "'", function (err, sids, fields){
                        if(err) throw err;
                        else console.log(sids);
                    });
                }
            }
        );
    }
};

exports.show = function(req, res){
    console.log("USER ID IN URL IS: " + req.params.id);
    res.send(req.cookies.sid);
};

exports.follow = function(req, res){
    res.send("respond with a resource");
};

exports.unfollow = function(req, res){
    res.send("respond with a resource");
};