"use strict"

let companiesSQL = require("./mock-companies.json");
let config = require("./config.json");

let mysql = require('mysql');

let mysql_connection = JSON.parse(JSON.stringify(config.mysql_connection));
delete mysql_connection.database;
let con = mysql.createConnection(mysql_connection);

con.connect(function(err) {
    if (err) throw err;

    let createDbQuery = "create database " + config.mysql_connection.database;
    con.query(createDbQuery, function (err, result) {
        if (err) throw err;

        let useDbQuery = "use " + config.mysql_connection.database;
        con.query(useDbQuery, function (err, result) {
            if (err) throw err;

            let createTableQuery = `CREATE TABLE companies (
                id INT NOT NULL,
                name varchar(255) NOT NULL UNIQUE,
                earn INT NOT NULL,
                parent_company_id INT,
                PRIMARY KEY (id)
            ) DEFAULT CHARSET=utf8`
            con.query(createTableQuery, function (err, result) {
                if (err) throw err;
                con.end();
            });
        });
    });
});
