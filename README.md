# Solution To Eliftech School Test Task

This repository is a solution to task given in Eliftech School Test Task, which you can find in the file 'Eliftech School Test Task.pdf', which is located in the root of the repository.

### Running the app on the local machine

In order to run the app for the first time on your local machine you have to do the following steps:

1. Install Node.js.
2. Install MySQL.
3. Make sure MySQL server is running on your computer.
4. Clone or download the repository. If you downloaded the repository in archive, unpack the archive.
5. Open the repository in command line on you computer.
6. Execute the command below to install packages in node_modules folder in the root of the repository.
```
npm install
```
7. Create database eliftech_school_test_companies and an empty table named companies inside it by executing the command below.
```
node create_database_and_empty_table.js
```
8. Start the server by executing the command below.
```
node server.js
```
9. Go to http://localhost:8081/.

To run the app again you just need to do steps 1, 3, 8, 9.

## Author

* **[Bohdan Shcherbak](https://github.com/ibodi)**
