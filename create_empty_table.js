"use strict"

const config = require("./config.json");
const mysql = require('mysql');
const con = mysql.createConnection(config.connection);

const createTableQuery = `CREATE TABLE companies (
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
