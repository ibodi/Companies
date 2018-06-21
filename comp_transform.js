"use strict"

/*
// Short introduction

// I am going to use MySQL or PostgreSQL database while solving this task.

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
// below that I've written to do this job, but to try and solve this problem by yourself, 
// or ask someone to solve it.
*/

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

module.exports = {
    companiesSQLTransform
};
