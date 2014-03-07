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
    req.upload_time = (new Date()/1);
    req.conn.query("INSERT INTO Photos (time_stamp, owner_id, caption) VALUES ('" + req.upload_time + "', '" + req.user_id + "', '" + req.body.title + "')", function (err, results, fields){
        if(err) throw err;
        else{
            console.log("successfully added photo to Photos TABLE");
            next();
        }
    });
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
            console.log("successfully added path to photo");
            next();
        }
    });
}

exports.populateStreamTable = function(req, res, next){
    req.conn.query("INSERT INTO Streams (stream_id, photo_id) SELECT follower_id, '" + req.photo_id + "' FROM Follows WHERE followee_id = '" + req.user_id + "'", function (err, results, fields){
        if(err) throw err;
        else{
            console.log("updated Streams table")
            next();
        }
    });
}

//app.post('/photos/create', photo.create);
exports.create = function(req, res){
    req.conn.query("SELECT * FROM Streams", function (err, results, fields){
        if(err) throw err;
        else{
            console.log("STREAMS:");
            console.log(results);
        }
    });

    //split the url into an array and then get the last chunk and render it out in the send req.
    var pathArray = req.files.image.path.split( '\\' );

    res.send(util.format(' Task Complete \n uploaded %s (%d Kb) to %s as %s'
        , req.files.image.name
        , req.files.image.size / 1024 | 0
        , req.files.image.path
        , req.body.title
        , req.files.image
        , '<img src="uploads/' + pathArray[(pathArray.length - 1)] + '">'
    ));

    fs.rename(req.files.image.path, req.files.image.path.replace(pathArray[pathArray.length-1], req.photo_path));
};

//app.get('/photos/:id.:ext', photo.show);
exports.show = function(req, res){
    var id = req.params.id;
    var ext = req.params.ext;

    fs.readFile(imageDirectory + id + "." + ext, function(err, data){
        if(err){
            if(err.code === 'ENOENT'){
                res.render('error', {
                    title: '404 | Page Not Found',
                    code: 404
                })
                return;
            } else{
                res.render('error', {
                    title: '500 | Internal Server Error',
                    code: 500
                })
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
    gm(img).resize(thumbnailSize).stream(function streamOut (err, stdout, stderr) {

        if(err){
            res.send('something went wrong. err ' + err.message, 200);
            return;
        }
        if(stderr){
            //res.send('something went wrong. stderr ' + stderr, 200);
            //return;
            console.log(stderr);
        }
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