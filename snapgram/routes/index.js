
/*
 * GET home page.
 */

exports.index = function(req, res){
    req.conn.query("SELECT * FROM Users WHERE sid = '" + req.cookies.sid + "'", function (err, results, fields){
        if(err) throw err;
        else{
            if(results.length > 0){
                req.conn.query("SELECT * FROM Streams a, Photos b WHERE a.stream_id = '" + results[0].user_id + "' AND a.photo_id = b.photo_id", function (err, results, fields){
                    if(err) throw err;
                    else{
                        console.log(results);
                    }
                });

                res.render('index', {
                    title: 'Express',
                    logged_in: true,
                    sid: req.cookies.sid,
                    user_name: results[0].user_name
                });
            }
            else{
                res.render('index', {
                    title: 'Express',
                    logged_in: false
                })
            }
        }

    });
};