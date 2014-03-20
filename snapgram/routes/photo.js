/**
 * Created by ASE Lab on 03/03/14.
 */
var gm = require('gm');
var fs = require('fs');
var imageDirectory = 'images/';
var thumbnailSize = 400;
var util = require('util');

//app.get('/photos/new', photo.new);
exports.new = function(req, res){
    res.render('upload', {
        title: 'Upload Images',
        logged_in: true,
        user_name: req.username,
        myuid: req.myuid
    });
};

exports.getUserIDFromSID = function(req, res, next){
    req.conn.query("SELECT * FROM Users WHERE sid = '" + req.cookies.sid + "'", function (err, results, fields){
        if(err){
            sendInternalServerError(req, res);
        }
        else{
            console.log(results);
            if(results.length > 0){
                user_id = results[0].user_id;
                console.log("User ID is " + user_id);
                req.user_id = user_id;
                req.name = results[0].name;
                next()
            }
            else{
                //error, SID not found... redirect to login screen?
                res.redirect('/sessions/new?redir='+req.url, 302);
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
            error: 'file cannot be empty',
            myuid: req.myuid
        });
    }
    else{
        var nameArray = req.files.image.name.split('.');
        var ext = nameArray[nameArray.length - 1].toLowerCase();

        if(ext === 'jpg' || ext === 'jpeg' || ext === 'gif' || ext === 'bmp' || ext === 'png'){
            req.upload_time = (new Date()/1);
            var shared = 'no';
            req.conn.query("INSERT INTO Photos (time_stamp, owner_id, owner_name, original_owner, original_owner_name, caption, shared) VALUES ('" + req.upload_time + "', '" + req.user_id + "', '" + req.name + "', '" + req.user_id + "', '" + req.name + "', '" + req.body.title + "', '" + shared + "')", function (err, results, fields){
                if(err){
                    sendInternalServerError(req, res);
                }
                else{
                    console.log("successfully added photo to Photos TABLE");
                    console.log(results);
                    next();
                }
            });
        }
        else{
            fs.unlinkSync(file.path);
            res.status(302);
            res.render('upload', {
                title: 'Upload Images',
                logged_in: true,
                error: 'not an image file',
                myuid: req.myuid
            });            
        }
    }
}

exports.addPhotoToTableShared = function(req, res, next){
    req.upload_time = (new Date()/1);
    req.conn.query("SELECT caption, photo_path, owner_id, original_owner FROM Photos WHERE photo_id = '" + req.params.pid + "'", function (err, results, fields){
        if(err){
            sendInternalServerError(req, res);
        }
        if(typeof results[0] != 'undefined' && results[0].original_owner != null){
            req.conn.query("SELECT name FROM Users WHERE user_id = '"+ results[0].original_owner +"'", function(err,name){
                if(err){
                    sendInternalServerError(req, res);
                }
                else{
                    var shared = 'yes';
                    req.conn.query("INSERT INTO Photos (caption, time_stamp, owner_id, owner_name, photo_path, original_owner, original_owner_name, shared) VALUES ('" + results[0].caption + "', '" + req.upload_time + "', '" + req.user_id + "',  '" + req.name + "', '" + results[0].photo_path + "', '" + results[0].original_owner + "', '" + name[0].name + "', '" + shared + "')", function (err, results, fields){
                        if(err){
                            sendInternalServerError(req, res);
                        }
                        else{
                            req.conn.query("SELECT * FROM Photos", function(err, results){
                                if(err){
                                    sendInternalServerError(req, res);
                                }
                                console.log(results)
                            })
                            console.log("updated Streams table")
                            next();
                        }
                    });
                }                    
            });
        }
        else if(typeof results[0] != 'undefined'){
            req.conn.query("INSERT INTO Photos (caption, time_stamp, owner_id, owner_name, photo_path, original_owner) VALUES ('" + results[0].caption + "', '" + req.upload_time + "', '" + req.user_id + "', '" + req.name + "', '" + results[0].photo_path + "', '" + results[0].owner_id + "')", function (err, results, fields){
                if(err){
                    sendInternalServerError(req, res);
                }
                else{
                    req.conn.query("SELECT * FROM Photos", function(err, results){
                        if(err){
                            sendInternalServerError(req, res);
                        }
                        console.log(results)
                    })
                    next();
                }
            });
        }
        else{
            sendNotFoundError(req,res);
        }
    })
}

exports.getPhotoID = function(req, res, next){
    console.log(req.upload_time);
    req.conn.query("SELECT * FROM Photos WHERE time_stamp = '" + req.upload_time + "' AND owner_id = '" + req.user_id + "'", function (err, results, fields){
        if(err){
            sendInternalServerError(req, res);
        }
        else{
            console.log(results);
            if(results.length > 0){
                photo_id = results[0].photo_id;
                console.log("Photo ID is " + photo_id);
                req.photo_id = photo_id;
                next();
            }
            else{
                sendInternalServerError(req, res);
            }
        }
    });
}

exports.insertPhotoPathToTable = function(req, res, next){
    var nameArray = req.files.image.name.split('.');
    var ext = nameArray[nameArray.length - 1];
    req.photo_path = req.photo_id + "." + ext;
    req.conn.query("UPDATE Photos SET photo_path = '" + req.photo_path + "' WHERE time_stamp = '" + req.upload_time + "' AND owner_id = '" + req.user_id + "'", function (err, results, fields){
        if(err){
            sendInternalServerError(req, res);
        }
        else{
            console.log("path is: " + req.photo_path);
            console.log("end of insertPhotoToTable");
            next();
        }
    });
}

exports.populateStreamTable = function(req, res, next){
    req.conn.query("INSERT INTO Streams (stream_id, photo_id) SELECT follower_id, '" + req.photo_id + "' FROM Follows WHERE followee_id = '" + req.user_id + "'", function (err, results, fields){
        if(err){
            sendInternalServerError(req, res);
        }
        else{
            console.log("end of populateStreamTable")
            next();
        }
    });
}

exports.redirect = function(req,res){
    res.redirect("/");
}

exports.populateStreamTableShared = function(req, res, next){
    req.conn.query("SELECT * FROM Follows WHERE followee_id = '" + req.user_id + "'", function(err, results){
    //req.conn.query("SELECT b.stream_id, b.photo_id FROM Follows a, Streams b, Photos c WHERE a.followee_id = '" + req.user_id + "' AND b.stream_id = a.follower_id AND b.photo_id = c.photo_id", function(err, results){
        if(err){
            sendInternalServerError(req, res);
        }
        else{
            console.log("Crazy abc select:");
            console.log(results);
            results.forEach(function(result){
                req.conn.query("DELETE FROM Streams WHERE stream_id = '" + result.follower_id + "' AND photo_id = '" + req.params.pid + "'", function(err, results){
                    if(err){
                        sendInternalServerError(req, res);
                    }
                })
            });
            next();
        }
    })
}

//app.post('/photos/create', photo.create);
exports.create = function(req, res){
    req.conn.query("SELECT * FROM Streams", function (err, results, fields){
        if(err){
            sendInternalServerError(req, res);
        }
        else{
            console.log("STREAMS TABLE:");
            console.log(results);
        }
    });

    //split the url into an array and then get the last chunk and render it out in the send req.
    var pathArray = req.files.image.path.split( '\/' );
    fs.rename(req.files.image.path, req.files.image.path.replace(pathArray[pathArray.length-1], req.photo_path));
    res.status(302);
    res.render('upload', {
        title: 'Upload Images',
        logged_in: true,
        error: 'Image uploaded successfully',
        myuid: req.myuid
    });      
};

//app.get('/photos/:id.:ext', photo.show);
exports.show = function(req, res){
    var id = req.params.id;
    var ext = req.params.ext;
    var filePath = imageDirectory + id + "." + ext;
    if(req.originalUrl.indexOf('shared')!=-1){
            filePath = '/shared/'+id+"."+ext;
    }
    fs.readFile(filePath, function(err, data){
        if(err){
            if(err.code === 'ENOENT'){
                sendNotFoundError(req,res);
            } else{
                sendInternalServerError(req, res);
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

    var filePath = imageDirectory + id + "." + ext;
    if(req.originalUrl.indexOf('shared')!=-1){
                img = '/shared/'+id+"."+ext;
    }

    fs.readFile(img, function(err, data){
        if(err){
            if(err.code === 'ENOENT'){
                sendNotFoundError(req,res);
            } else{
                sendInternalServerError(req, res);
            }
        }        

        else{
            var width, height, ratio;
            gm(img).size(function(err, val) {
                width = val.width;
                height = val.height;
                ratio = thumbnailSize/width;

                gm(img).thumbnail(thumbnailSize, ratio*height).gravity('Center').stream(function streamOut (err, stdout, stderr) {
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
            });
        }
    });
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

function sendNotFoundError(req,res){
    // Reply with ERROR 404
    res.status(404);
    // respond with html page
    if (req.accepts('html')) {
        res.render('error', {
            title: '404 | Page Not Found',
            code: 404,
            myuid: req.myuid
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