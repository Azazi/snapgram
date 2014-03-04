
/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var user = require('./routes/user');
var http = require('http');
var path = require('path');

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(app.router);
app.use(require('stylus').middleware(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.index);
app.get('/feed', routes.index);

//app.get('/users', user.list);
app.get('/users/new', user.new);
app.post('/users/create', user.create);
app.get('/users/:id', user.show);
app.get('/users/:id/follow', user.follow);
app.get('/users/:id/unfollow', user.unfollow);

app.get('/sessions/new', session.new);
app.post('/sessions/create', session.create);

app.get('/photos/new', photo.new);
app.post('/photos/create', photo.create);
app.get('/photos/thumbnail/:id.:ext', photo.showThumbnail);
app.get('/photos/:id.:ext', photo.show);

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
