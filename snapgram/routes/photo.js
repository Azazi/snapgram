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
        title: 'Upload Images'
    });
};

//app.post('/photos/create', photo.create);
exports.create = function(req, res){
    console.log('file info: ',req.files.image);

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

    fs.rename(req.files.image.path, req.files.image.path.replace(pathArray[pathArray.length-1], req.files.image.name));
};

//app.get('/photos/:id.:ext', photo.show);
exports.show = function(req, res){
    var id = req.params.id;
    var ext = req.params.ext;

    fs.readFile(imageDirectory + id + "." + ext, function(err, data){
        if(err){
            if(err.code === 'ENOENT'){
                res.send('404: Page Not Found', 404);
                return;
            } else{
                res.send('500: Internal Server Error', 500);
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