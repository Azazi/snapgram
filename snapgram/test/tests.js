var bulk = require('../bulk');
var chai = require('chai');
var assert = chai.assert;
var mysql = require('mysql');

var conn = mysql.createConnection({
    host: 'web2.cpsc.ucalgary.ca',
    user: 's513_amazazi',
    password: '10063797',
    database: 's513_amazazi'
});