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
    var cryptpassword = crypto.createHash('md5').update(req.body.password).digest('hex');
    console.log("Username is: " + username);
    console.log("Password is: " + password);
    var login = false;

    req.conn.query("SELECT * FROM Users WHERE user_name = '" + username + "' AND password = '" + cryptpassword + "'", function(err,usernames,fields){
        if(err){
            console.log(err);
            sendInternalServerError(req, res);
        }
        else{
            if(usernames.length <= 0){
                console.log("CRAPPING OUT");
                res.render('login', {
                    title: 'Login to Snapgram',
                    redir: req.body.redir,
                    failed: 'true'
                });
            }
            else{
                console.log("user and password exists in db..........................");
                req.session['loggedin'] = req.body.username;
                req.session['userid'] = usernames[0].user_id;
		  console.log("session saved.............................................................................");

                if(req.session.loggedin != undefined){
                    if(req.body.redir != '' && req.body.redir != undefined){
                        console.log(req.body.redir);
                        res.redirect(req.body.redir);
                    }
                    else{
                        res.redirect('/');
                    }
                }
            }
        }
    });
};

exports.end = function(req, res){
        req.session.destroy();
        res.redirect('/');
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