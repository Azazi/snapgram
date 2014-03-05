
/*
 * GET home page.
 */

exports.index = function(conn){
    return function(req, res){
        conn.query("SELECT * FROM Users WHERE sid = '" + req.cookies.sid + "'", function (err, results, fields){
            if(err) throw err;
            else{
                console.log('SID updated for\t' + req.body.username + "\t" + new Date());
                console.log(results);
                if(results.length > 0){
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
    }
};