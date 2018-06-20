"use strict"

const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: true
});

let createTableQuery = `CREATE TABLE companies (
    id INT NOT NULL,
    name varchar(255) NOT NULL UNIQUE,
    earn INT NOT NULL,
    parent_company_id INT,
    PRIMARY KEY (id)
) DEFAULT CHARSET=utf8`

(async () => {
    const client = await pool.connect();
    await client.query(createTableQuery);
    client.release();
})();
       