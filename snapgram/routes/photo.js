/**
 * Created by ASE Lab on 03/03/14.
 */
var gm = require('gm');
//var gm = require('gm').subClass({ imageMagick: true });
var fs = require('fs');
var imageDirectory = 'images/';
var thumbnailSize = 400;
var util = require('util');

//app.get('/photos/new', photo.new);
exports.new = function(req, res){
    res.render('upload', {
        title: 'Upload Images',
        logged_in: true
    });
};

exports.getUserIDFromSID = function(req, res, next){
    req.conn.query("SELECT * FROM Users WHERE sid = '" + req.cookies.sid + "'", function (err, results, fields){
        if(err) throw err;
        else{
            console.log(results);
            if(results.length > 0){
                user_id = results[0].user_id;
                console.log("User ID is " + user_id);
                req.user_id = user_id;
                next()
            }
            else{
                //error, SID not found... redirect to login screen?
                res.redirect('/sessions/new');
            }
        }
    });
}

exports.addPhotoToTable = function(req, res, next){
    var file = req.files.image;
    if(file.size === 0) { 
        fs.unlinkSync(file.path);
        res.status(302);
        res.render('upload', {
            title: 'Upload Images',
            logged_in: true,
            error: 'wrong input'
        });
    }
    else{
        var nameArray = req.files.image.name.split('.');
        var ext = nameArray[nameArray.length - 1];

        if(ext === 'jpg' || ext === 'jpeg' || ext === 'gif' || ext === 'bmp' || ext === 'png'){
            req.upload_time = (new Date()/1);
            req.conn.query("INSERT INTO Photos (time_stamp, owner_id, caption) VALUES ('" + req.upload_time + "', '" + req.user_id + "', '" + req.body.title + "')", function (err, results, fields){
                if(err) throw err;
                else{
                    console.log("successfully added photo to Photos TABLE");
                    console.log(results);
                    next();
                }
            });
        }
        else{
            res.status(302);
            res.render('upload', {
                title: 'Upload Images',
                logged_in: true,
                error: 'not image'
            });            
        }
    }
}

exports.addPhotoToTableShared = function(req, res, next){
    req.upload_time = (new Date()/1);
    req.conn.query("SELECT caption, photo_path, owner_id, original_owner FROM Photos WHERE photo_id = '" + req.params.pid + "'", function (err, results, fields){
        if(results[0].original_owner != null){
            req.conn.query("INSERT INTO Photos (caption, time_stamp, owner_id, photo_path, original_owner) VALUES ('" + results[0].caption + "', '" + req.upload_time + "', '" + req.user_id + "', '" + results[0].photo_path + "', '" + results[0].original_owner + "')", function (err, results, fields){
                if(err) throw err;
                else{
                    req.conn.query("SELECT * FROM Photos", function(err, results){
                        console.log(results)
                    })
                    console.log("updated Streams table")
                    next();
                }
            });
        }
        else{
            req.conn.query("INSERT INTO Photos (caption, time_stamp, owner_id, photo_path, original_owner) VALUES ('" + results[0].caption + "', '" + req.upload_time + "', '" + req.user_id + "', '" + results[0].photo_path + "', '" + results[0].owner_id + "')", function (err, results, fields){
                if(err) throw err;
                else{
                    req.conn.query("SELECT * FROM Photos", function(err, results){
                        console.log(results)
                    })
                    next();
                }
            });
        }
    })
}

exports.getPhotoID = function(req, res, next){
    console.log(req.upload_time);
    req.conn.query("SELECT * FROM Photos WHERE time_stamp = '" + req.upload_time + "' AND owner_id = '" + req.user_id + "'", function (err, results, fields){
        if(err) throw err;
        else{
            console.log(results);
            if(results.length > 0){
                photo_id = results[0].photo_id;
                console.log("Photo ID is " + photo_id);
                req.photo_id = photo_id;
                next();
            }
            else{
                //error, photo_id not found... what now?!?!?!?!? oh, internal error?
                res.render('error', {
                    title: '500 | Internal Server Error',
                    code: 500
                })
            }
        }
    });
}

exports.insertPhotoPathToTable = function(req, res, next){
    var nameArray = req.files.image.name.split('.');
    var ext = nameArray[nameArray.length - 1];
    req.photo_path = req.photo_id + "." + ext;
    req.conn.query("UPDATE Photos SET photo_path = '" + req.photo_path + "' WHERE time_stamp = '" + req.upload_time + "' AND owner_id = '" + req.user_id + "'", function (err, results, fields){
        if(err) throw err;
        else{
            console.log("path is: " + req.photo_path);
            console.log("end of insertPhotoToTable");
            next();
        }
    });
}

exports.populateStreamTable = function(req, res, next){
    req.conn.query("INSERT INTO Streams (stream_id, photo_id) SELECT follower_id, '" + req.photo_id + "' FROM Follows WHERE followee_id = '" + req.user_id + "'", function (err, results, fields){
        if(err) throw err;
        else{
            console.log("end of populateStreamTable")
            next();
        }
    });
}

exports.populateStreamTableShared = function(req, res, next){
    req.conn.query("SELECT b.stream_id, b.photo_id FROM Follows a, Streams b, Photos c WHERE a.followee_id = '" + req.user_id + "' AND b.stream_id = a.follower_id AND b.photo_id = c.photo_id", function(err, results){
        if(err) throw err;
        else{
            console.log("Crazy abc select:");
            console.log(results);
            results.forEach(function(result){
                req.conn.query("DELETE FROM Streams WHERE stream_id = '" + result.stream_id + "' AND photo_id = '" + result.photo_id + "'", function(err, results){
                    if(err) throw err;
                })
            })
            next();
        }
    })
}

//app.post('/photos/create', photo.create);
exports.create = function(req, res){
    req.conn.query("SELECT * FROM Streams", function (err, results, fields){
        if(err) throw err;
        else{
            console.log("STREAMS TABLE:");
            console.log(results);
        }
    });

    //split the url into an array and then get the last chunk and render it out in the send req.
    var pathArray = req.files.image.path.split( '\\' );
    fs.rename(req.files.image.path, req.files.image.path.replace(pathArray[pathArray.length-1], req.photo_path));
    res.status(200);
    res.redirect('/photos/'+req.photo_path);
};

//app.get('/photos/:id.:ext', photo.show);
exports.show = function(req, res){
    var id = req.params.id;
    var ext = req.params.ext;

    fs.readFile(imageDirectory + id + "." + ext, function(err, data){
        if(err){
            if(err.code === 'ENOENT'){
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
            } else{
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
                    res.send({ error: 'Not found' });
                    return;
                }

                // default to plain-text. send()
                res.type('txt').send('Not found');
                return;
            }
        }

        else{
            switch(ext)
            {
                case 'gif':
                    res.writeHead(200, {'Content-Type':'image/gif'});
                    res.write(data);
                    break;
                case 'jpg':
                    res.writeHead(200, {'Content-Type':'image/jpg'});
                    res.write(data);
                    break;
                case 'jpeg':
                    res.writeHead(200, {'Content-Type':'image/jpeg'});
                    res.write(data);
                    break;
                case 'png':
                    res.writeHead(200, {'Content-Type':'image/png'});
                    res.write(data);
                    break;
                case 'bmp':
                    res.writeHead(200, {'Content-Type':'image/bmp'});
                    res.write(data);
                    break;
                default:
                    /// TODO: Clarify this!
                    /// I am not sure if this should be reached since we will
                    /// perform the file check when the image is uploaded!
                    console.log("Image type may not be supported.");
                    res.writeHead(200, {'Content-Type':'image/jpg'});
            }
            res.end();
        }
    });


}

//app.get('/photos/thumbnail/:id.:ext', photo.showThumbnail);
exports.showThumbnail = function(req, res){
    var id = req.params.id;
    var ext = req.params.ext;
    var img = imageDirectory + id + "." + ext;

    fs.readFile(imageDirectory + id + "." + ext, function(err, data){
        if(err){
            if(err.code === 'ENOENT'){
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
            } else{
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
                    res.send({ error: 'Not found' });
                    return;
                }

                // default to plain-text. send()
                res.type('txt').send('Not found');
                return;
            }
        }        

        else{
            gm(img).resize(thumbnailSize).stream(function streamOut (err, stdout, stderr) {
                switch(ext)
                {
                    case 'gif':
                        res.writeHead(200, {'Content-Type':'image/gif'});
                        break;
                    case 'jpg':
                        res.writeHead(200, {'Content-Type':'image/jpg'});
                        break;
                    case 'jpeg':
                        res.writeHead(200, {'Content-Type':'image/jpeg'});
                        break;
                    case 'png':
                        res.writeHead(200, {'Content-Type':'image/png'});
                        break;
                    case 'bmp':
                        res.writeHead(200, {'Content-Type':'image/bmp'});
                        break;
                    default:
                        console.log("Image type may not be supported.");
                        res.writeHead(200, {'Content-Type':'image/jpg'});
                }
                var piping = stdout.pipe(res);

                piping.on('finish', function(){
                    res.end();
                })
            });
        }
    });
}