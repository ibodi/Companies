"use strict"

let express = require('express');
let app = express();
let MongoClient = require('mongodb').MongoClient;
let bodyParser = require("body-parser");

let mongoUrl = "mongodb://localhost:27017/";

/*
// Short introduction

// I am going to use mongodb database while solving this task.
// Both the database and the collection we are going to use are named "companies".

// Data in the database is represented in format like the commented variable companiesMDB 
// below. Let us call it Format A.

let companiesMDB = [
    {
        "_id" : 1,
        "name" : "Company1",
        "earn" : 25000,
        "parent_company_id" : null
    },
    {
        "_id" : 2,
        "name" : "Company2",
        "earn" : 13000,
        "parent_company_id" : 1
    },
    {
        "_id" : 3,
        "name" : "Company3",
        "earn" : 10000,
        "parent_company_id" : 1
    },
    {
        "_id" : 4,
        "name" : "Company4",
        "earn" : 10000,
        "parent_company_id" : null
    },
]

// In order to show this data on the html page, I need to represent it in format 
// like the commented variable companies below. Let us call it Format B.

let companies = [
    {   
        "_id" : 1,
        "name" : "Company1",
        "earn" : 25000,
        "earn_plus_subcomp_earn" : 48000,
        "subcompanies" : [
            {
                "_id" : 2,
                "name" : "Company2",
                "earn" : 13000,
                "earn_plus_subcomp_earn" : 13000,
                "subcompanies" : []
            },
            {
                "_id" : 3,
                "name" : "Company3",
                "earn" : 10000,
                "earn_plus_subcomp_earn" : 10000,
                "subcompanies" : []
            }
        ]
    },
    {
        "_id" : 4,
        "name" : "Company4",
        "earn" : 10000,
        "earn_plus_subcomp_earn" : 10000,
        "subcompanies" : []
    }
];

// Transforming data from format A to format B is a very interesting task. 
// I advise you not to read the ingenious function companiesMDBTransform(companiesMDB)
// at the bottom of the file that I've written to do this job, but to 
// try and solve this problem by yourself, or ask someone to solve it.
*/


app.use(express.static(__dirname + '/app'));
app.use(bodyParser.json()); // this lets us receive json in REST requests

// Forward to main page with the companies.
app.get('/', function (req, res) {
   res.sendFile(__dirname + "/app/index.html");
});

app.get('/api/companies', function (req, res) {
    MongoClient.connect(mongoUrl, function(err, db) {
        if (err) {
            logErrorAndSendReport(err, res);
            return;
        }
        var dbo = db.db("companies");
        dbo.collection("companies").find({}).toArray(function(err, companiesMDB) {
            if (err) {
                logErrorAndSendReport(err, res);
                db.close();
                return;
            }
            let companies = companiesMDBTransform(companiesMDB);

            if (companies.length == 0){
                res.send({
                    success : true,
                    companies,
                    maxId : 1
                });
                db.close();
                return;
            }

            dbo.collection("companies").find().sort({ _id : -1 }).limit(1).toArray(function(err, itemWithMaxId) {
                if (err) {
                    logErrorAndSendReport(err, res);
                    db.close();
                    return;
                }
                let maxId =  itemWithMaxId[0]._id;
                res.send({
                    success : true,
                    companies,
                    maxId
                });
                db.close();
            });
        });
    });
});

// Delete the company from the database
// I don't know what I am doing wrong.
// Deleting a company takes a looot 
app.delete('/api/company', function (req, res) {
    let _id = parseInt(req.query._id);
    console.log('id ' + _id);
    let start = Date.now();

    function second() {
        return (Date.now() - start)/1000;
    }
    console.log("connectiog to mongo");
    MongoClient.connect(mongoUrl, function(err, db) {
        if (err) {
            logErrorAndSendReport(err, res);
            return;
        }
        console.log("connectiog to db : " + second());
        var dbo = db.db("companies");
        console.log("finding company with id " + _id + " : " + second());
        dbo.collection("companies").find({ _id }).toArray(function(err, result) {
            if (err) {
                logErrorAndSendReport(err, res);
                db.close();
                return;
            }
            let parent_company_id = result[0].parent_company_id;

            console.log("finding children : " + second());
            dbo.collection("companies").find({ parent_company_id : _id }).toArray(function(err, result) {
                if (err) {
                    logErrorAndSendReport(err, res);
                    db.close();
                    return;
                }

                console.log("deleting company with id " + _id + " : " + second());
                dbo.collection("companies").deleteOne({ _id }, function(err, obj) {
                    if (err) {
                        logErrorAndSendReport(err, res);
                        db.close();
                        return;
                    }
                    console.log("deleted company with id " + _id + " : " + second());
                });

                console.log("starting to update children : " + second());
                let n = 0;
                let companiesFailed = [];
                let errMessage = "";
                for(let company of result) {
                    var myquery = { _id : company._id };
                    var newvalues = { $set: { parent_company_id } };
                    console.log("starting to update child with id " + company._id + " : " + second());
                    dbo.collection("companies").updateOne(myquery, newvalues, function(err, res) {
                        if (err) {
                            console.error(err.stack);
                            errMessage += err.name + " : " + err.message + "\n";
                            companiesFailed.push(company.name);
                        };
                        n++;
                        //console.log("company with id " + _id + " is updated");
                        console.log("updated child with id " + company._id + " : " + second());
                    });
                }
                // clearInterval(timerId)
                let timerId = setInterval(() => {
                    if(n == result.length) {
                        if(companiesFailed.length != 0) {
                            if(companiesFailed.length == result.length) {
                                res.send({
                                    success : false,
                                    cause : errMessage
                                });
                                db.close();
                                clearInterval(timerId);
                            }
                            res.send({
                                success : true,
                                companiesFailed,
                                errMessage
                            });
                            db.close();
                            clearInterval(timerId);
                        }
                        res.send({
                            success : true
                        });
                        db.close();
                        clearInterval(timerId);
                    }
                }, 250);


            });
        });
    });
});





// Add company to database
app.put('/api/company', function (req, res) {

    let company = req.body;

    MongoClient.connect(mongoUrl, function(err, db) {
        if (err) {
            logErrorAndSendReport(err, res);
            return;
        }
        var dbo = db.db("companies");
        dbo.collection("companies").insertOne(company, function(err, result) {
            if (err) {
                logErrorAndSendReport(err, res);
                db.close();
                return;
            }
            res.send({
                success : true,
            });
            db.close();
        });
    });
});

// Update company in database
app.post('/api/company', function (req, res) {
    
    let { _id , name , earn } = req.body;
    
    MongoClient.connect(mongoUrl, function(err, db) {
        if (err) {

            res.send({
                success : false,
                cause : err.name + " : " + err.message
            });
            return;
        }
        var dbo = db.db("companies");
        var myquery = { _id };
        var newvalues = { $set: { name, earn } };
        dbo.collection("companies").updateOne(myquery, newvalues, function(err, result) {
            if (err) {
                res.send({
                    success : false,
                    cause : err.name + " : " + err.message
                });
                db.close();
                return;
            }

            res.send({
                success : true
            });
            db.close();
        });
    });
});

// Forward to 404 page
app.get("/*", function (req, res) {
    res.sendFile(__dirname + "/app/html/404.html");
});

app.listen(8081);

function logErrorAndSendReport(err, res) {
    console.error(err.stack);
    res.send({
        success : false,
        cause : err.name + " : " + err.message
    });
}

// Transforms data from Format A to Format B.
function companiesMDBTransform(companiesMDB) {
    let result = [];
    let helpCompanies = {};

    for(let companyMDB of companiesMDB) {
        if(companyMDB.parent_company_id == null) {
            result.push(companyMDB);
        }
        helpCompanies[companyMDB._id] = companyMDB;
        companyMDB.subcompanies = [];
    }

    for(let companyMDB of companiesMDB) {
        if(companyMDB.parent_company_id != null) {
            helpCompanies[companyMDB.parent_company_id].subcompanies.push(companyMDB);
        }
    }

    for (let companyMDB of result) {
        companyMDBTransform(companyMDB);
    }

    return result; 
}

function companyMDBTransform(companyMDB) {
    delete companyMDB.parent_company_id;

    let earn_plus_subcomp_earn = companyMDB.earn;
    
    for (let subcompanyMDB of companyMDB.subcompanies) {
        earn_plus_subcomp_earn += companyMDBTransform(subcompanyMDB);
    }

    companyMDB.earn_plus_subcomp_earn = earn_plus_subcomp_earn;
    return earn_plus_subcomp_earn;
}
