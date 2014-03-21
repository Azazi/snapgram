var http = require('http');
var chai = require('chai');
var assert = chai.assert;
var mysql = require('mysql');
var should = require('should');
var crypto = require('crypto');
var user = require('../routes/user');

http.globalAgent.maxSockets = 20;

var conn = mysql.createConnection({
    host: 'web2.cpsc.ucalgary.ca',
    user: 's513_amazazi',
    password: '10063797',
    database: 's513_amazazi'
});

var queries = ['DROP TABLE IF EXISTS Users, Photos, Follows, Streams',
    'CREATE TABLE IF NOT EXISTS Users (user_id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT, user_name VARCHAR(35), name VARCHAR(70), password CHAR(128), followers_count INT UNSIGNED, photo_count INT UNSIGNED, gender CHAR(1), dob DATE, profile_image BIGINT UNSIGNED, feed_id INT UNSIGNED, stream_id INT UNSIGNED, sid VARCHAR(35)) ENGINE=INNODB;',
    'CREATE TABLE IF NOT EXISTS Photos (photo_id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT, caption VARCHAR(200), time_stamp BIGINT UNSIGNED, owner_id INT UNSIGNED, photo_path VARCHAR(200), owner_name VARCHAR(70), original_owner BIGINT UNSIGNED, original_owner_name VARCHAR(70), shared VARCHAR(3)) ENGINE=INNODB;',
    'CREATE TABLE IF NOT EXISTS Follows (follower_id INT UNSIGNED, followee_id INT UNSIGNED) ENGINE=INNODB;',
    'CREATE TABLE IF NOT EXISTS Streams (stream_id INT UNSIGNED, photo_id BIGINT UNSIGNED) ENGINE=INNODB;',
    "INSERT INTO Users (user_name, name, password, sid) VALUES ('username1', 'John Doe', '" + crypto.createHash('md5').update('password1').digest('hex') + "', '" + "00000" + "');",
    "INSERT INTO Follows (follower_id, followee_id) VALUES ('1', '3')"]

queries.forEach(function(queryString){
    conn.query(queryString, function (err, rows, fields){
        if(err) throw err;
        else console.log('query successful\t' + new Date());
    });
});

describe("user.sendInternalServerError()", function(){
    var req = {
        conn: conn,
        query: {
            password: "superman"
        }
    }

    var res = {
        title: "",
        jsonObject: {},
        render: function(string, params){
            this.title = params.title
        },
        statusObject: {
            send: function(string){
                console.log("status: " + string)
            }
        },
        status: function(statusCode){
            return this.statusObject;
        },
        send: function(jsonObject){
            this.jsonObject = jsonObject;
        },
        type: function(mimeType){
            return this.plainTextObject;
        },
        plainTextObject: {
            error: "",
            send: function(errorMsg){
                this.error = errorMsg;
            }
        }
    }

    it("should set title with error message if req accepts html", function(done){
        req.accepts = function(string){
            if(string == 'html')return true;
            else return false;
        }
        user.sendInternalServerError(req, res);
        res.title.should.equal("500 | Internal Server Error");
        done();
    })

    it("should call res.send if req accepts json and not html", function(done){
        req.accepts = function(string){
            if(string == 'json')return true;
            else return false;
        }
        user.sendInternalServerError(req, res);
        res.jsonObject.error.should.equal('Internal Server Error');
        done();
    })

    it("should call res.type.send if req defaults to plaintext", function(done){
        req.accepts = function(string){
            return false;
        }
        user.sendInternalServerError(req, res);
        res.plainTextObject.error.should.equal('Internal Server Error');
        done();
    })
})

describe("user.follow()", function(){
    it("should redirect to '/' if relationship already exists", function(done){
        var req = {
            conn: conn,
            cookies: {
                sid: '00000'
            },
            params: {
                id: 7
            }
        };

        var res = {redirectMsg: "",
            redirect: function(string){
                assert.equal(string, "/users/" + req.params.id);
                done();
            }
        };

        user.follow(req, res);
    })
    it("should redirect to '/users/req.params.id' if relationship does not exist yet", function(done){
        var req = {
            conn: conn,
            cookies: {
                sid: '00000'
            },
            params: {
                id: 3
            }
        };

        var res = {redirectMsg: "",
            redirect: function(string){
                assert.equal(string, "/");
                done();
            }
        };
        user.follow(req, res);
    })
})