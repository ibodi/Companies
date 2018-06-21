"use strict"

const express = require('express');
const app = express();
const bodyParser = require("body-parser");
const mysql = require('mysql');
const config = require("./config.json");
const child_process = require('child_process');
const companiesSQL = require("./mock-companies.json");
const { companiesSQLTransform } = require("./comp_transform");
const { logErrorAndSendReport } = require("./log_err_and_send_report");

const con = mysql.createConnection(config.connection);

app.use(express.static(__dirname + '/app'));
app.use(bodyParser.json()); // this lets us receive json in REST requests

// Forwards to main page with companies.
app.get('/', function (req, res) {
//    res.sendFile(__dirname + "/app/index.html");
    res.render("index");
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

app.listen(config.port, ()=>console.log("Server started. Listening at " + config.port));
