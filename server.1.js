"use strict"

const express = require('express');
const app = express();
const bodyParser = require("body-parser");
const { port,  connection: { host, user, password, database } }  = require("./config.json");
const companiesSQL = require("./mock-companies.json");
const PORT = process.env.PORT || port;
const { companiesSQLTransform } = require("./comp_transform");
const { logErrorAndSendReport } = require("./log_err_and_send_report");
const http = require('http').Server(app);
const io = require('socket.io')(http);

const conString = process.env.DATABASE_URL || 
    `postgres://${ user }:${ password }@${ host }:5432/${ database }`;

const { Pool } = require('pg');
const pool = new Pool({
  connectionString: conString,
  ssl: false
});

app.use(express.static(__dirname + '/app'));
app.use(express.static(__dirname + '/node_modules'));
app.use(bodyParser.json()); // this lets us receive json in REST requests

io.on('connection', function(socket){
    socket.on("update", async function () {
        try {
            const client = await pool.connect();
            const {rows : companiesSQL} = await client.query('select * from companies');
            const {rows : [ { max : maxId } ]} = await client.query("select max(id) from companies");
            client.release();
            
            let companies = companiesSQLTransform(companiesSQL);
            socket.broadcast.emit("update",{
                success: true,
                companies,
                maxId: maxId ? maxId : 1
            });
        } catch (err) {
            console.error(err.stack);
            socket.broadcast.emit("update",{
                success : false,
                cause : err.name + " : " + err.message
            });
        }
    });
});

// Forwards to main page with companies.
app.get('/', function (req, res) {
    res.render("index");  
    // res.sendFile(__dirname + '/app/index.html'); 
});

app.get('/api/companies', async function (req, res) {
    try {
        const client = await pool.connect();
        const {rows : companiesSQL} = await client.query('select * from companies');
        const {rows : [ { max : maxId } ]} = await client.query("select max(id) from companies");
        client.release();
        
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
app.delete('/api/company', async function (req, res) {
    let id = parseInt(req.query.id);
    try {
        const client = await pool.connect();
        const { rows : [ { parent_company_id } ] } = await client.query("select parent_company_id from companies where id = " + id);
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
app.put('/api/company', async function (req, res) {

    let company = req.body;
    try {
        const client = await pool.connect();
        const value = "(" +
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
app.post('/api/company', async function (req, res) {   
    const { name , earn, id } = req.body;
    try {
        const client = await pool.connect();
        await client.query("UPDATE companies SET name = '" + name + "', earn = " + earn +
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

// app.listen(PORT, ()=>console.log("Server started. Listening on port " + PORT));
http.listen(PORT, ()=>console.log("Server started. Listening on port " + PORT));