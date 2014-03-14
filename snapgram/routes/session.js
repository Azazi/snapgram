var crypto = require('crypto');
var _ = require('underscore');

/**
 * Created by ASE Lab on 03/03/14.
 */

exports.new = function(req, res){
	res.render('login', {
		title: 'Login to Snapgram',
        redir: req.query.redir,
        myuid: req.myuid
    });
};

exports.create = function(req, res){
    var username = req.body.username;
    var password = req.body.password;
    console.log("Username is: " + username);
    console.log("Password is: " + password);
    var login = false;

    req.conn.query(
        'SELECT * FROM Users;',
        function(err,usernames,fields){
            if(err){
                console.log(err);
                sendInternalServerError(req, res);
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
                req.conn.query("UPDATE Users SET sid = '" + hash + "' WHERE user_name = '" + req.body.username + "'", function (err, rows, fields){
                    if(err){
                        sendInternalServerError(req, res);
                    }
                    else console.log('SID updated for\t' + req.body.username + "\t" + new Date());
                });

                if(req.body.redir != ''){
                    res.cookie("sid", hash).redirect(req.body.redir);
                }
                else{
                    res.cookie("sid", hash).redirect('/');
                }

                req.conn.query("SELECT sid FROM Users WHERE user_name = '" + req.body.username + "'", function (err, sids, fields){
                    if(err){
                        sendInternalServerError(req, res);
                    }
                    else console.log(sids);
                });
            }
            else{
                res.render('login', {
		            title: 'Login to Snapgram',
                    redir: req.body.redir,
                    failed: 'true'
                });
            }
        }
    );
};

exports.end = function(req, res){
    res.cookie("sid", 0).redirect('/');
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