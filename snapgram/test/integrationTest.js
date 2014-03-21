/**
 * Created by ASE Lab on 21/03/14.
 */
process.env.NODE_ENV = 'test';
var http = require('http');
var chai = require('chai');
var assert = chai.assert;
var mysql = require('mysql');
var should = require('should');
var user = require('../routes/user');
var request = require('request');
var async = require('async');
var Browser = require("zombie");
var app = require('../app');
var fs = require('fs');

var conn = mysql.createConnection({
    host: 'web2.cpsc.ucalgary.ca',
    user: 's513_amazazi',
    password: '10063797',
    database: 's513_amazazi'
});

describe("integration testing", function() {
    var browser = new Browser();
    var hostname = "http://localhost:8550"
    var cookieString = "";
    it("should load the home page", function(done) {
        browser
            .visit(hostname + "/")
            .then(function(){
                assert.deepEqual(browser.location.pathname, "/");
                assert.deepEqual(browser.statusCode, 200);
            })
            .then(done, done);
    });

    it("should load the login page", function(done) {
        browser
            .visit(hostname + "/sessions/new")
            .then(function(){
                assert.deepEqual(browser.location.pathname, "/sessions/new");
                assert.deepEqual(browser.statusCode, 200);
            })
            .then(done, done);
    });

    it("should sign in and create sessions", function(done) {
        browser
            .fill("username", "username2")
            .fill("password", "password2")
            .pressButton("submit", function(){
                assert.ok(browser.success);
                assert.equal(browser.statusCode, 200);
            })
            .then(function(){
                assert.deepEqual(browser.location.pathname, "/");
            })
            .then(done, done);
    });

    it("should load photo upload page", function(done) {
        var request = require("request");
        var jar = request.jar();
        var cookie = request.cookie("sid=00000");
        jar.setCookie(cookie, hostname);

        request({
            uri: hostname + '/photos/new',
            method: "GET",
            timeout: 20000,
            followRedirect: true,
            jar: jar,
            maxRedirects: 10
        }, function(error, res, body) {
            assert.deepEqual(browser.statusCode, 200);
            assert.deepEqual(res.statusCode, 200);
            done();
        });
    });

    /*it("should load photo upload page", function(done) {
        var jar = request.jar();
        var cookie = request.cookie("sid=00000");
        jar.setCookie(cookie, 'http://localhost');
        browser.setCookie('sid', '00000');

        browser
            .visit("http://localhost:8550/photos/new")
            .then(function(){
                assert.deepEqual(browser.location.pathname, "/photos/new");
                assert.deepEqual(browser.statusCode, 200);
            })
            .then(done, done);
    });*/

    it("should load the logout page and redirect", function(done) {
        browser
            .visit(hostname + "/sessions/end")
            .then(function(){
                assert.deepEqual(browser.location.pathname, "/");
                assert.deepEqual(browser.statusCode, 200);
            })
            .then(done, done);
    });

    it("should load the register page", function(done) {
        browser
            .visit(hostname + "/users/new")
            .then(function(){
                assert.deepEqual(browser.location.pathname, "/users/new");
                assert.deepEqual(browser.statusCode, 200);
            })
            .then(done, done);
    });

    it("should register a new user", function(done) {
        browser
            .fill("name", "user6789")
            .fill("username", "username6789")
            .fill("password", "password6789")
            .pressButton("submit", function(){
                assert.ok(browser.success);
                assert.equal(browser.statusCode, 200);
            })
            .then(function(){
                assert.deepEqual(browser.location.pathname, "/feed");
            })
            .then(done, done);
    });
});