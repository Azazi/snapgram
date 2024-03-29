
/*
 * GET home page.
 */

exports.index = function(req, res){
        var st = new Date();      
		//console.log(res.req.session);
            if(req.session.loggedin != "" && req.session.loggedin != undefined){
                req.conn.query("SELECT * FROM Streams a, Users c, Photos b WHERE a.stream_id = '" + req.session.userid + "' AND a.photo_id = b.photo_id AND c.user_id = '" + req.session.userid + "' LIMIT 0,30", function (err, results, fields){
                    if(err){
                        sendInternalServerError(req, res);
                    }
                    else{
                        console.log('Feed Page Time: ', new Date() - st, ' ms');
                        res.status(200);
                        res.render('index', {
                            title: 'Welcome to Snapgram',
                            logged_in: true,
                            sid: req.cookies.sid,
                            user_name: res.req.session.loggedin,
                            stream: results,
                            page: req.query.page,
                            myuid: req.myuid                            
                        });
                    }
                });


            }
            else{
                res.render('index', {
                    title: 'Welcome to Snapgram',
                    logged_in: false
                })
            }
};

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