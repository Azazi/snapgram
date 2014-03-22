/**
 * Created by ASE Lab on 20/03/14.
 */

var http = require('http');
var chai = require('chai');
var assert = chai.assert;
var mysql = require('mysql');
var should = require('should');
var user = require('../routes/user');
var request = require('request');

var conn = mysql.createConnection({
    host: 'web2.cpsc.ucalgary.ca',
    user: 's513_amazazi',
    password: '10063797',
    database: 's513_amazazi'
});

describe("Redirect Checks", function(){
    var hostname = 'node.cs.ucalgary.ca';

    it("should redirect to login if trying to access /feed while not logged in", function(done){
        createUserTableIfNotExist();
        request({
            cookies: {
                sid: ""
            },
            uri: 'http://' + hostname + ':8550' + '/feed',
            method: "GET",
            timeout: 20000,
            followRedirect: true,
            maxRedirects: 10
        }, function(error, res, body) {
            assert.deepEqual(res.statusCode, 200);
            done();
        });
    });

    it("should display register page if trying to access /users/new while not logged in", function(done){
        createUserTableIfNotExist();
        http.get({  host: hostname,
            port: 8550,
            path: '/users/new',
            agent: false}, function(res) {
            res.statusCode.should.equal(200);
            done();
        });
    });

    it("should redirect to login if trying to access /users/:id while not logged in", function(done){
        createUserTableIfNotExist();
        http.get({  host: hostname,
            port: 8550,
            path: '/users/0',
            agent: false}, function(res) {
            res.headers.location.should.match("/sessions/new?redir=/users/0");
            res.statusCode.should.equal(302);
            done();
        });
    });

    it("should redirect to login if trying to access /users/:id/follow while not logged in", function(done){
        createUserTableIfNotExist();
        http.get({  host: hostname,
                    port: 8550,
                    path: '/users/0/follow',
                    agent: false}, function(res) {
            res.headers.location.should.match("/sessions/new?redir=/users/0/follow");
            res.statusCode.should.equal(302);
            done();
        });
    });

    it("should redirect to login if trying to access /users/:id/unfollow while not logged in", function(done){
        createUserTableIfNotExist();
        http.get({  host: hostname,
            port: 8550,
            path: '/users/0/unfollow',
            agent: false}, function(res) {
            res.headers.location.should.match("/sessions/new?redir=/users/0/unfollow");
            res.statusCode.should.equal(302);
            done();
        });
    });

    it("should display login page if trying to access /sessions/new while not logged in", function(done){
        createUserTableIfNotExist();
        http.get({  host: hostname,
            port: 8550,
            path: '/sessions/new',
            agent: false}, function(res) {
            res.statusCode.should.match(200)
            done();
        });
    });

    it("should display logout page if trying to access /sessions/end, regardless if logged in or not", function(done){
        createUserTableIfNotExist();
        http.get({  host: hostname,
            port: 8550,
            path: '/sessions/end',
            agent: false}, function(res) {
                res.headers.location.should.match("/");
                assert.deepEqual(res.statusCode, 302);
        });
        done();

    });

    it("should redirect to login if trying to access /photos/new while not logged in", function(done){
        createUserTableIfNotExist();
        http.get({  host: hostname,
            port: 8550,
            path: '/photos/new',
            agent: false}, function(res) {
            res.headers.location.should.match("/sessions/new?redir=/photos/new");
            res.statusCode.should.equal(302);
            done();
        });
    });

    it("should redirect to login if trying to access /photos/thumbnail/:id.:ext while not logged in", function(done){
        createUserTableIfNotExist();
        http.get({  host: hostname,
            port: 8550,
            path: '/photos/thumbnail/0.jpg',
            agent: false}, function(res) {
            res.headers.location.should.match("/sessions/new?redir=/photos/thumbnail/0.jpg");
            res.statusCode.should.equal(302);
            done();
        });
    });

    it("should redirect to login if trying to access /photos/thumbnail/shared/:id.:ext while not logged in", function(done){
        createUserTableIfNotExist();
        http.get({  host: hostname,
            port: 8550,
            path: '/photos/thumbnail/shared/0.jpg',
            agent: false}, function(res) {
            res.headers.location.should.match("/sessions/new?redir=/photos/thumbnail/shared/0.jpg");
            res.statusCode.should.equal(302);
            done();
        });
    });

    it("should redirect to login if trying to access /photos/:id.:ext while not logged in", function(done){
        createUserTableIfNotExist();
        http.get({  host: hostname,
            port: 8550,
            path: '/photos/0.jpg',
            agent: false}, function(res) {
            res.headers.location.should.match("/sessions/new?redir=/photos/0.jpg");
            res.statusCode.should.equal(302);
            done();
        });
    });

    it("should redirect to login if trying to access /photos/shared/:id.:ext while not logged in", function(done){
        createUserTableIfNotExist();
        http.get({  host: hostname,
            port: 8550,
            path: '/photos/shared/0.jpg',
            agent: false}, function(res) {
            res.headers.location.should.match("/sessions/new?redir=/photos/shared/0.jpg");
            res.statusCode.should.equal(302);
            done();
        });
    });

    it("should redirect to login if trying to access /photos/share/:pid.:ext while not logged in", function(done){
        createUserTableIfNotExist();
        http.get({  host: hostname,
            port: 8550,
            path: '/photos/share/0',
            agent: false}, function(res) {
            res.headers.location.should.match("/sessions/new?redir=/photos/share/0");
            res.statusCode.should.equal(302);
            done();
        });
    });
})

createUserTableIfNotExist = function(){
    conn.query('CREATE TABLE IF NOT EXISTS Users (user_id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT, user_name VARCHAR(35), name VARCHAR(70), password CHAR(128), followers_count INT UNSIGNED, photo_count INT UNSIGNED, gender CHAR(1), dob DATE, profile_image BIGINT UNSIGNED, feed_id INT UNSIGNED, stream_id INT UNSIGNED, sid VARCHAR(35)) ENGINE=INNODB;', function (err, rows, fields){
        if(err) throw err;
        else console.log('query successful\t' + new Date());
    });
}