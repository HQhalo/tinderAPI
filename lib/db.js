'user strict';

var mysql = require('mysql');

//local mysql db connection
var connection = mysql.createConnection({
    host     : 'remotemysql.com',
    user     : 'uOTYxAPRZZ',
    password : 'dlraDUgEUW',
    database : 'uOTYxAPRZZ'
});

connection.connect(function(err) {
    if (err) throw err;
});

module.exports = connection;