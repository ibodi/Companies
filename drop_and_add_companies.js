
let companies = require("./companies");

var mysql = require('mysql');

var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "Biedronka2017"
});

con.connect(function(err) {
    if (err) throw err;
    con.query("drop database if exists companies;", function (err, result) {
        if (err) throw err;
        console.log(JSON.stringify(result));
        con.query("create database companies;", function (err, result) {
            if (err) throw err;
            console.log(JSON.stringify(result));
            con.query("use companies;", function (err, result) {
                if (err) throw err;
                console.log(JSON.stringify(result));
                con.query("CREATE table companies( id INT NOT NULL, name VARCHAR(255) NOT NULL UNIQUE, earn INT NOT NULL, parent_company_id INT, PRIMARY KEY (id) );", function (err, result) {
                    if (err) throw err;
                    console.log(JSON.stringify(result));
                    let values = [];
                    for(let companyMDB of companies.companiesSQL) {
                        values.push([
                            companyMDB._id,
                            companyMDB.name,
                            companyMDB.earn,
                            companyMDB.parent_company_id
                        ]);
                    }
                    con.query("INSERT INTO companies VALUES ?;", [values], function (err, result) {
                        if (err) throw err;
                        console.log(JSON.stringify(result));
                        
                    });
                });
            });
        });
    });

});
