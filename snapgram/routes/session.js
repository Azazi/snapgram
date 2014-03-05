var crypto = require('crypto');
var _ = require('underscore');

/**
 * Created by ASE Lab on 03/03/14.
 */

exports.new = function(req, res){
    res.sendfile('./public/loginform.html');
};

exports.create = function(conn){
    return function(req, res){
        var username = req.body.username;
        var password = req.body.password;
        console.log("Username is: " + username);
        console.log("Password is: " + password);
        var login = false;
        ////////////////////////////
        conn.query(
            'SELECT * FROM Users;',
            function(err,usernames,fields){
                if(err){
                    console.log(err);
                    return;
                }
                console.log(usernames)
                _.each(usernames, function(user){
                    console.log(user.user_name);
                    console.log(req.body.username);
                    if(user.user_name == req.body.username){
                        console.log("User found in database, checking password...");
                        console.log("Stored password is: " + user.password);
                        console.log("Entered password is: " + crypto.createHash('md5').update(req.body.password).digest('hex'));
                        if(user.password == crypto.createHash('md5').update(req.body.password).digest('hex')){
                            console.log("...password matches!")
                            login = true;
                        }
                    }
                })

                if(login){
                    var hash = crypto.createHash('md5').update(new Date() + req.body.username).digest('hex');
                    conn.query("UPDATE Users SET sid = '" + hash + "' WHERE user_name = '" + req.body.username + "'", function (err, rows, fields){
                        if(err) throw err;
                        else console.log('SID updated for\t' + req.body.username + "\t" + new Date());
                    });
                    res.cookie("sid", hash).send('<p>Cookie Set: <a href="/users/1">View Here</a></p>');

                    conn.query("SELECT sid FROM Users WHERE user_name = '" + req.body.username + "'", function (err, sids, fields){
                        if(err) throw err;
                        else console.log(sids);
                    });
                }
                else{
                    res.send("Invalid username or password!");
                }
            }
        );
    }
};

exports.end = function(req, res){
    req.session = null; //effectively logs out
    res.sendfile('./'); //redirect to index? probably not doing this right...
}