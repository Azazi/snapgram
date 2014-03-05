/**
 * Created by ASE Lab on 03/03/14.
 */

var imageDirectory = 'images/';

//app.get('/photos/new', photo.new);
exports.new = function(req, res){
    res.send("respond with a resource");
};

//app.post('/photos/create', photo.create);
exports.create = function(req, res){
    res.send("respond with a resource");
};

//app.get('/photos/:id.:ext', photo.show);
exports.show = function(id, ext){
    return function(req, res){
        gm(imageDirectory + id + "." + ext)
            .stream(function (err, stdout, stderr) {
                var piping = stdout.pipe(res);

                piping.on('end', function(){
                    switch(ext)
                    {
                        case gif:
                            res.writeHead(200, {'Content-Type':'image/gif'});
                            break;
                        case jpg:
                            res.writeHead(200, {'Content-Type':'image/jpg'});
                            break;
                        case jpeg:
                            res.writeHead(200, {'Content-Type':'image/jpeg'});
                            break;
                        case png:
                            res.writeHead(200, {'Content-Type':'image/png'});
                            break;
                        case bmp:
                            res.writeHead(200, {'Content-Type':'image/bmp'});
                            break;
                        default:
                            console.log("Image type may not be supported.");
                            res.writeHead(200, {'Content-Type':'image/jpg'});
                    }
                    res.end();
                })
            });
    }
}

//app.get('/photos/thumbnail/:id.:ext', photo.showThumbnail);
exports.showThumbnail = function(id, ext, size){
    return function(req, res){
        gm(imageDirectory + id + "." + ext)
            .resize(size)
            .stream(function (err, stdout, stderr) {
                var piping = stdout.pipe(res);

                piping.on('end', function(){
                    switch(ext)
                    {
                        case gif:
                            res.writeHead(200, {'Content-Type':'image/gif'});
                            break;
                        case jpg:
                            res.writeHead(200, {'Content-Type':'image/jpg'});
                            break;
                        case jpeg:
                            res.writeHead(200, {'Content-Type':'image/jpeg'});
                            break;
                        case png:
                            res.writeHead(200, {'Content-Type':'image/png'});
                            break;
                        case bmp:
                            res.writeHead(200, {'Content-Type':'image/bmp'});
                            break;
                        default:
                            console.log("Image type may not be supported.");
                            res.writeHead(200, {'Content-Type':'image/jpg'});
                    }
                    res.end();
                })
            });
    }
}