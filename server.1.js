"use strict"

const express = require('express');
const app = express();
// const path = require('path');
const bodyParser = require("body-parser");
// const mysql = require('mysql');
const config = require("./config.json");
// const child_process = require('child_process');
const companiesSQL = require("./mock-companies.json");
const PORT = process.env.PORT || 5000;

// const con = mysql.createConnection(config.mysql_connection);

const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: true
});

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
//    res.sendFile(__dirname + "/app/index.html");
    console.error("HERE I AM")
    res.render("index");

    
});

app.get('/createdb', async (req, res) => {
    // con.query("select * from companies", function (err, companiesSQL) {
    //     if (err) {
    //         console.log(JSON.stringify(err));
    //         logErrorAndSendReport(err, res);
    //         return;
    //     };
    //     let companies = companiesSQLTransform(companiesSQL);
    //     con.query("select max(id) from companies", function(err, maxId){
    //         if (err) {
    //             logErrorAndSendReport(err, res);
    //             return;
    //         }
    //         res.send({
    //             success: true,
    //             companies,
    //             maxId: maxId.length == 0 ? 1 : maxId[0]["max(id)"]
    //         });
    //     });
    // });

    try {
        const client = await pool.connect();
        const result = await client.query("drop TABLE if exists companies");
        let createTableQuery = `CREATE TABLE companies (
            id INT NOT NULL,
            name varchar(255) NOT NULL UNIQUE,
            earn INT NOT NULL,
            parent_company_id INT,
            PRIMARY KEY (id)
        )`; // DEFAULT CHARSET=utf8 // :,(
        const result2 = await client.query(createTableQuery);
        console.log("drop table RESULT:" + JSON.stringify(result, null, 2));
        console.log("create table RESULT:" + JSON.stringify(result2, null, 2));
        client.release();
        res.send(result);
    } catch (err) {
        logErrorAndSendReport(err, res);
    }
});

app.get('/api/companies', async function (req, res) {
    // con.query("select * from companies", function (err, companiesSQL) {
    //     if (err) {
    //         console.log(JSON.stringify(err));
    //         logErrorAndSendReport(err, res);
    //         return;
    //     };
    //     let companies = companiesSQLTransform(companiesSQL);
    //     con.query("select max(id) from companies", function(err, maxId){
    //         if (err) {
    //             logErrorAndSendReport(err, res);
    //             return;
    //         }
    //         res.send({
    //             success: true,
    //             companies,
    //             maxId: maxId.length == 0 ? 1 : maxId[0]["max(id)"]
    //         });
    //     });
    // });
    try {
        console.log("I AM HERE IN API COMPANIES");
        const client = await pool.connect();
        const result1 = await client.query('select * from companies');
        const result2 = await client.query("select max(id) from companies");
        const {rows : companiesSQL} = result1;
        const {rows : [ { max : maxId } ]} = result2;

        client.release();
        // console.log("result1" + JSON.stringify(result1, null, 2));
        // console.log("result2" + JSON.stringify(result2, null, 2));
        // console.log("companiesSQL" + JSON.stringify(companiesSQL, null, 2));
        // console.log("maxId" + maxId);
        let companies = companiesSQLTransform(companiesSQL);
        res.send({
            success: true,
            companies,
            maxId: maxId ? maxId : 1
        });
    } catch (err) {
        logErrorAndSendReport(err, res);
    }
});

// Deletes all the data from the companies table
app.delete('/api/companies', async function (req, res) {
    try {
        const client = await pool.connect();
        await client.query('delete from companies');
        client.release();
        res.send({
            success: true
        });
    } catch (err) {
        logErrorAndSendReport(err, res);
    }
});

// Drops the database and creates it and a table of companies again, and inserts mock data 
// from mock-companies.json into the table
app.post("/api/companies", async function (req, res) {
    try {
        const client = await pool.connect();
        await client.query('delete from companies');

        let maxId = 1;
        let values = "";
        for(let companySQL of companiesSQL) {
            if(maxId < companySQL.id) {
                maxId = companySQL.id
            }
            values += "(" + companySQL.id + ", '" + companySQL.name + "', " + 
                companySQL.earn + ", " + companySQL.parent_company_id + "), ";
        }
        let insertDbQuery = "INSERT INTO companies VALUES " + values.substring(0, values.length - 2);
        await client.query(insertDbQuery);

        client.release();
        let companies = companiesSQLTransform(companiesSQL);
        res.send({
            success: true,
            companies,
            maxId
        });
    } catch (err) {
        logErrorAndSendReport(err, res);
    }
});

// Deletes the company from the database
app.delete('/api/company', function (req, res) {
    let id = parseInt(req.query.id);
    
    // con.query("select parent_company_id from companies where id = " + id + ";", function (err, result){
    //     if (err) {
    //         logErrorAndSendReport(err, res);
    //         return;
    //     }
    //     let parent_company_id = result[0].parent_company_id;
    //     con.query("delete from companies where id = " + id + ";", function(err, result){
    //         if (err) {
    //             logErrorAndSendReport(err, res);
    //             return;
    //         }
    //         con.query("update companies set parent_company_id = " + parent_company_id + " where parent_company_id = " + id + ";", function (err, result) {
    //             if (err) {
    //                 logErrorAndSendReport(err, res);
    //                 return;
    //             }
    //             res.send({
    //                 success: true
    //             });
    //         });
    //     });
    // });
    try {
        const client = await pool.connect();
        const result1 = await client.query("select parent_company_id from companies where id = " + id);
        const { rows : [ { parent_company_id } ] } = result1;

        await client.query("delete from companies where id = " + id);
        await client.query("update companies set parent_company_id = " + parent_company_id + " where parent_company_id = " + id);
        client.release();
        res.send({
            success: true
        });
    } catch (err) {
        logErrorAndSendReport(err, res);
    }
});

// Adds company to the database
app.put('/api/company', function (req, res) {

    let company = req.body;
    try {
        const client = await pool.connect();
        let value = "("
            company.id + ", '" +
            company.name + "', " +
            company.earn + ", " +
            company.parent_company_id + ")";
        await client.query("insert into companies values " + value);
        client.release();

        res.send({
            success: true,
        });
    } catch (err) {
        logErrorAndSendReport(err, res);
    }
});

// Updates company in the database
app.post('/api/company', function (req, res) {
    
    let { name , earn, id } = req.body;
    try {
        const client = await pool.connect();

        await client.query("UPDATE companies SET name = \"" + name + "\", earn = " + earn +
            " WHERE id = " + id);
        client.release();

        res.send({
            success: true,
        });
    } catch (err) {
        logErrorAndSendReport(err, res);
    }
});

// Forwards to 404 page
app.get("/*", function (req, res) {
    res.sendFile(__dirname + "/app/html/404.html");
});

app.listen(PORT, ()=>console.log("Server started. Listening on port " + PORT));

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
