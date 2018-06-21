"use strict"

const { Pool } = require('pg');
const conString = process.env.DATABASE_URL || "postgres://ibodi:Biedronka2017@localhost:5432/companies";
const pool = new Pool({
  connectionString: conString,
  ssl: false
});

const createTableQuery = `CREATE TABLE companies (
    id INT NOT NULL,
    name varchar(255) NOT NULL UNIQUE,
    earn INT NOT NULL,
    parent_company_id INT,
    PRIMARY KEY (id)
)`; //  DEFAULT CHARSET=utf8 // DFAULT doesn't workf

(async () => {
    const client = await pool.connect();
    const result = await client.query(createTableQuery);
    client.release();
})();
       