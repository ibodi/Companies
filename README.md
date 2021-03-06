# Solution To Eliftech School Test Task

This repository is a solution to [eliftech school test task](https://docs.google.com/document/d/120dL3A0v8EWTbetQbeFOBhWUyD4DFRLQNCQoTMW54To/edit). This project is deployed using heroku. [Here is the site](https://fathomless-retreat-34521.herokuapp.com/).

## Running the app on a local machine

In order to run the app for the first time on your local machine you have to do the following steps:

1. Install `Node.js`.
2. Choose what relational database management system (RDBMS) you want to use among `MySQL` and `PostgreSQL`.
3. Install RDBMS that you've chosen. In case you've chosen `PostgreSQL` make sure that your `PostgreSQL` server will be running on port 5432.
4. Make sure this RDBMS' server is running on your computer.
5. Choose your RDBMS' user to work with the database or create a new one.
6. Choose or create a database to work with.
7. Clone or download the repository. If you downloaded the repository in archive, unpack the archive.
8. Open the repository in command line on you computer.
9. Execute the command below to install packages in node_modules folder in the root of the repository.
```
npm install
```
10. Open config.json file in the root of the repo and change the value of the `user` field to you chosen user's name, the value of the `password` field to you chosen user's password, the value of `database` field to the name of the chosen database, and optionaly the value of `port` field to port that you want your server to listen on. 
11. Create empty table companies by executing the command `node create_empty_table.js` (MySQL) or `node create_empty_table.1.js` (PostgreSQL).
12. Start the server by executing the command `node server.js` (MySQL) or `node server.1.js` (PostgreSQL).
13. Go to http://localhost:PORT/, where you must replace `PORT` with the value of the field `port` in config.json.

To run the app again you just need to do steps 4, 8, 12, 13.

## Author

**[Bohdan Shcherbak](https://github.com/ibodi)**
