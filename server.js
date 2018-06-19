"use strict"

const express = require('express');
const app = express();
const bodyParser = require("body-parser");
const mysql = require('mysql');
const config = require("./config.json");
const child_process = require('child_process');
const companiesSQL = require("./mock-companies.json");

const con = mysql.createConnection(config.mysql_connection);

app.use(express.static(__dirname + '/app'));
app.use(bodyParser.json()); // this lets us receive json in REST requests

/*
// Short introduction

// I am going to use MySQL database while solving this task.

// Data in the database is represented in format like the commented variable companiesSQL 
// below. Let us call it Format A.

let companiesSQL = [
    {
        "id" : 1,
        "name" : "Company1",
        "earn" : 25000,
        "parent_company_id" : null
    },
    {
        "id" : 2,
        "name" : "Company2",
        "earn" : 13000,
        "parent_company_id" : 1
    },
    {
        "id" : 3,
        "name" : "Company3",
        "earn" : 10000,
        "parent_company_id" : 1
    },
    {
        "id" : 4,
        "name" : "Company4",
        "earn" : 10000,
        "parent_company_id" : null
    },
]

// In order to show this data on the html page, I need to represent it in format 
// like the commented variable companies below. Let us call it Format B.

let companies = [
    {   
        "id" : 1,
        "name" : "Company1",
        "earn" : 25000,
        "earn_plus_subcomp_earn" : 48000,
        "subcompanies" : [
            {
                "id" : 2,
                "name" : "Company2",
                "earn" : 13000,
                "earn_plus_subcomp_earn" : 13000,
                "subcompanies" : []
            },
            {
                "id" : 3,
                "name" : "Company3",
                "earn" : 10000,
                "earn_plus_subcomp_earn" : 10000,
                "subcompanies" : []
            }
        ]
    },
    {
        "id" : 4,
        "name" : "Company4",
        "earn" : 10000,
        "earn_plus_subcomp_earn" : 10000,
        "subcompanies" : []
    }
];

// Transforming data from format A to format B is a very interesting task. 
// I advise you not to read the ingenious function companiesSQLTransform(companiesSQL)
// at the bottom of the file that I've written to do this job, but to 
// try and solve this problem by yourself, or ask someone to solve it.
*/

// Forwards to main page with companies.
app.get('/', function (req, res) {
   res.sendFile(__dirname + "/app/index.html");
});

app.get('/api/companies', function (req, res) {
    con.query("select * from companies", function (err, companiesSQL) {
        if (err) {
            console.log(JSON.stringify(err));
            logErrorAndSendReport(err, res);
            return;
        };
        let companies = companiesSQLTransform(companiesSQL);
        con.query("select max(id) from companies", function(err, maxId){
            if (err) {
                logErrorAndSendReport(err, res);
                return;
            }
            res.send({
                success: true,
                companies,
                maxId: maxId.length == 0 ? 1 : maxId[0]["max(id)"]
            });
        });
    });
});

// Deletes all the data from the companies table
app.delete('/api/companies', function (req, res) {
    con.query("delete from companies", function (err, result) {
        if (err) {
            logErrorAndSendReport(err, res);
            return;
        }

        res.send({
            success: true
        });
    });
});

// Drops the database and creates it and a table of companies again, and inserts mock data 
// from mock-companies.json into the table
app.post("/api/companies", function (req, res) {
    con.query("delete from companies", function (err, result) {
        if (err) {
            logErrorAndSendReport(err, res);
            return;
        }
        let values = [];
        let maxId = 1;
        for(let companySQL of companiesSQL) {
            if(maxId < companySQL.id) {
                maxId = companySQL.id
            }
            values.push([
                companySQL.id,
                companySQL.name,
                companySQL.earn,
                companySQL.parent_company_id
            ]);
        }

        let insertDbQuery = "INSERT INTO companies VALUES ?";
        con.query(insertDbQuery, [values], function (err, result) {
            if (err) {
                logErrorAndSendReport(err, res);
                return;
            }

            let companies = companiesSQLTransform(companiesSQL);
            res.send({
                success: true,
                companies,
                maxId
            });
        });
    });
});

// Deletes the company from the database
app.delete('/api/company', function (req, res) {
    let id = parseInt(req.query.id);
    
    con.query("select parent_company_id from companies where id = " + id + ";", function (err, result){
        if (err) {
            logErrorAndSendReport(err, res);
            return;
        }
        let parent_company_id = result[0].parent_company_id;
        con.query("delete from companies where id = " + id + ";", function(err, result){
            if (err) {
                logErrorAndSendReport(err, res);
                return;
            }
            con.query("update companies set parent_company_id = " + parent_company_id + " where parent_company_id = " + id + ";", function (err, result) {
                if (err) {
                    logErrorAndSendReport(err, res);
                    return;
                }
                res.send({
                    success: true
                });
            });
        });
    });
});

// Adds company to the database
app.put('/api/company', function (req, res) {

    let company = req.body;

    let newRow = [[[
        company.id,
        company.name,
        company.earn,
        company.parent_company_id
    ]]];
    con.query("insert into companies values ?;", newRow, function (err, result) {
        if(err) {
            logErrorAndSendReport(err, res);
            return;
        }
        res.send({
            success: true,
        });
    });
});

// Updates company in the database
app.post('/api/company', function (req, res) {
    
    let { name , earn, id } = req.body;
    con.query("UPDATE companies SET name = \"" + name + "\", earn = " + earn +
             " WHERE id = " + id + ";", function (err, result) {
        if(err) {
            logErrorAndSendReport(err, res);
            return;
        }
        res.send({
            success: true,
        });
    });
});

// Forwards to 404 page
app.get("/*", function (req, res) {
    res.sendFile(__dirname + "/app/html/404.html");
});

app.listen(config.port, ()=>console.log("Server started"));

function logErrorAndSendReport(err, res) {
    console.error(err.stack);
    res.send({
        success : false,
        cause : err.name + " : " + err.message
    });
}

// Transforms data from Format A to Format B.
function companiesSQLTransform(companiesSQL_) {
    let companiesSQL = JSON.parse(JSON.stringify(companiesSQL_));
    let result = [];
    let helpCompanies = {};

    for(let companySQL of companiesSQL) {
        if(companySQL.parent_company_id == null) {
            result.push(companySQL);
        }
        helpCompanies[companySQL.id] = companySQL;
        companySQL.subcompanies = [];
    }

    for(let companySQL of companiesSQL) {
        if(companySQL.parent_company_id != null) {
            helpCompanies[companySQL.parent_company_id].subcompanies.push(companySQL);
        }
    }

    for (let companySQL of result) {
        companySQLTransform(companySQL);
    }

    return result; 
}

function companySQLTransform(companySQL) {
    delete companySQL.parent_company_id;

    let earn_plus_subcomp_earn = companySQL.earn;
    
    for (let subcompanySQL of companySQL.subcompanies) {
        earn_plus_subcomp_earn += companySQLTransform(subcompanySQL);
    }

    companySQL.earn_plus_subcomp_earn = earn_plus_subcomp_earn;
    return earn_plus_subcomp_earn;
}
