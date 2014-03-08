
/*
 * GET home page.
 */

exports.index = function(req, res){
    req.conn.query("SELECT * FROM Users WHERE sid = '" + req.cookies.sid + "'", function (err, results, fields){
        if(err){
            sendInternalServerError(req, res);
        }
        else{            
            if(results.length > 0){
                var uname = results[0].user_name;
                req.conn.query("SELECT * FROM Streams a, Users c, Photos b WHERE a.stream_id = '" + results[0].user_id + "' AND a.photo_id = b.photo_id AND c.user_id = '" + results[0].user_id + "'", function (err, results, fields){
                    if(err){
                        sendInternalServerError(req, res);
                        return;
                    }
                    else{                      
                        console.log(results);
                        res.status(200);
                        res.render('index', {
                            title: 'Welcome to Snapgram',
                            logged_in: true,
                            sid: req.cookies.sid,
                            user_name: uname,
                            stream: results,
                            page: req.query.page
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