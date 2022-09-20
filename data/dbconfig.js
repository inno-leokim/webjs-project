const mysql = require('mysql');

const dbConn = mysql.createConnection({
    host : '49.247.132.184',
    port : '3306',
    user:'pineplatform',
    password:'pine1122',
    database: 'globiex'
});

module.exports = dbConn;
