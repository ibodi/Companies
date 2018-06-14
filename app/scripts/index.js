"use strict"

Array.prototype.contains = function (value) {
    return this.indexOf(value) > -1;
};

// Designed for containing a number which if added to one becomes an _id of
// newly created company.
let maxId;
// Designed for containing all company names so that we could prevent
// adding a company with already used name or replacing a company name
// with already used name.
let companyNames = [];

// This will be executed after the page is loaded for 
// taking data from database and drawing the tree of companies
// might take some time 
setTimeout(() => {
    let xhttp = new XMLHttpRequest();
    xhttp.onload = function() {
        if (this.readyState == 4 && this.status == 200) {
            let report = JSON.parse(this.responseText);
            if(!report.success) {
                error.innerHTML = "<li>Failed to load companies tree. " + report.cause + "</li>";
                return;
            }
            maxId = report.maxId;
            console.log(maxId);
            let companies = report.companies;
            updateCompanyNames(companies);

            let companiesHTMLElement = createCompaniesHTMLElement(companies);

            let liAddRootCompanyButton = document.createElement("li");
            let addRootCompanyButton = document.createElement("button");
            addRootCompanyButton.innerHTML = "ADD ROOT COMPANY";
            addRootCompanyButton.onclick = ()=>{
                let li = addCompanyInputField(null);
                companiesHTMLElement.appendChild(li);
            };
            liAddRootCompanyButton.appendChild(addRootCompanyButton);
            companiesHTMLElement.prepend(liAddRootCompanyButton)
            
            container.appendChild(companiesHTMLElement);
        }
    };
    xhttp.open("GET", "/api/companies", true);
    xhttp.send();
}, 0);

function updateCompanyNames(companies) {
    for(let company of companies) {
        companyNames.push(company.name);
        updateCompanyNames(company.subcompanies);
    }
}

function createCompaniesHTMLElement(companies) {
    let ul = document.createElement("ul");
    for(let company of companies) {
        let companyHTMLElement = createCompanyHTMLElement(company);
        ul.appendChild(companyHTMLElement);
    }
    return ul;
}

function createCompanyHTMLElement(company) {
    let li = document.createElement("li");
    
    let table = document.createElement("table");
    let tr = document.createElement("tr");
    let tdCompanyName = document.createElement("td");
    let tdCompanyEarn = document.createElement("td");
    let tdCompanyEarnPlusSubcompEarn = document.createElement("td");
    let tdDeleteButton = document.createElement("td");
    let tdAddButton = document.createElement("td");
    let tdEditButton = document.createElement("td");
    table.appendChild(tr);
    tr.appendChild(tdCompanyName);
    tr.appendChild(tdCompanyEarn);
    tr.appendChild(tdCompanyEarnPlusSubcompEarn);
    tr.appendChild(tdDeleteButton);
    tr.appendChild(tdAddButton);
    tr.appendChild(tdEditButton);

    tdCompanyName.innerHTML = company.name;
    tdCompanyEarn.innerHTML = company.earn;
    tdCompanyEarnPlusSubcompEarn.innerHTML = company.earn_plus_subcomp_earn;

    function  deleteCompany() {
        
        let companyEarnings = parseInt(tdCompanyEarn.innerHTML);
        let index = companyNames.indexOf(tdCompanyName.innerHTML);
        deleteCompanyFromDatabaseAndLiTag(company._id, li, index, companyEarnings);
    }
    let deleteButton = document.createElement("button");
    deleteButton.innerHTML = "DELETE";
    deleteButton.onclick = deleteCompany;
    tdDeleteButton.appendChild(deleteButton);

    function addCompany(){
        addSubcompanyInputField(li, company._id);
    }
    let addButton = document.createElement("button");
    addButton.innerHTML = "ADD SUBCOMPANY";
    addButton.onclick = addCompany;
    tdAddButton.appendChild(addButton);

    let editButton = document.createElement("button");
    editButton.innerHTML = "EDIT";
    editButton.onclick = ()=>{
        var index = companyNames.indexOf(tdCompanyName.innerHTML);
        if (index > -1) {
            companyNames.splice(index, 1);
        }

        deleteButton.onclick = undefined;
        deleteButton.classList.add("non-active-button");
        deleteButton.onfocus = deleteButton.blur;
        addButton.onclick = undefined;
        addButton.classList.add("non-active-button");
        addButton.onfocus = addButton.blur;

        let inputCompanyName = document.createElement("input");
        inputCompanyName.type = "text";
        inputCompanyName.value = tdCompanyName.innerHTML;
        tdCompanyName.innerHTML = "";
        tdCompanyName.appendChild(inputCompanyName);

        let oldCompanyEarnings = parseInt(tdCompanyEarn.innerHTML);

        let inputCompanyEarnings = document.createElement("input");
        inputCompanyEarnings.type = "number";
        inputCompanyEarnings.value = tdCompanyEarn.innerHTML;
        tdCompanyEarn.innerHTML = "";
        tdCompanyEarn.appendChild(inputCompanyEarnings);

        let saveButton = document.createElement("button");
        saveButton.innerHTML = "SAVE";
        saveButton.onclick = ()=>{
            let inputValuesAreValid = 
                checkValidityOfInputValuesAndPrintErrorMessagesIfNeeded(
                                            inputCompanyEarnings, inputCompanyName);
            if(!inputValuesAreValid) {
                return;
            }

            let newCompanyName = inputCompanyName.value.trim();
            let newCompanyEarnings = parseInt(inputCompanyEarnings.value);
            let differenceInEarnings = newCompanyEarnings - oldCompanyEarnings;
            updateCompanyInDatabaseAndItsTag(
                company._id, newCompanyName, newCompanyEarnings, li, 
                differenceInEarnings, tdCompanyName, tdCompanyEarn,
                saveButton, editButton, deleteButton, addButton, deleteCompany, addCompany);
        }
        editButton.replaceWith(saveButton);

    };
    tdEditButton.appendChild(editButton);

    li.appendChild(table);
    let subcompaniesHTMLElement = createCompaniesHTMLElement(company.subcompanies);
    li.appendChild(subcompaniesHTMLElement);

    return li;
}

function deleteCompanyFromDatabaseAndLiTag(_id, liCompany, indexInCompanyNames, companyEarnings) {
    console.log("deleting copany with id " + _id);
    let xhttp = new XMLHttpRequest();
    xhttp.onload = function () {
        let report = JSON.parse(this.responseText);
        if (this.readyState == 4 && this.status == 200 && report.success) {
            //console.log(this.responseText);
            let liParent = liCompany.parentElement.parentElement;
            if(liParent.tagName == "LI") {
                updateEarningsPlusSubcompanyEarningsForParentCompanies(liParent, -companyEarnings);
            }
            deleteCompanyLiTag(liCompany);
            companyNames.splice(indexInCompanyNames, 1);
        } else {
            error.innerHTML = "<li>Failed to delete company with id = " + _id + 
                (report.cause ? "\n\tcause: " + report.cause : "") + "</li>";
        }
    }
    xhttp.open("DELETE", "/api/company/?_id=" + _id, true);
    xhttp.send();
}

function deleteCompanyLiTag(liCompany) {
    let ulParent = liCompany.parentElement;
    let lastTag = liCompany.lastElementChild;
    if(lastTag.tagName == "UL") {
        while(lastTag.children.length != 0) {
            ulParent.appendChild(lastTag.firstElementChild);
        }
    }
    ulParent.removeChild(liCompany)
    if(ulParent.children.length == 0) {
        ulParent.remove();
    }
}

function updateCompanyInDatabaseAndItsTag(_id, newCompanyName, newCompanyEarnings, li, 
        differenceInEarnings,tdCompanyName, tdCompanyEarn, saveButton, editButton, 
        deleteButton, addButton, deleteCompany, addCompany) {

    let companyString= JSON.stringify({
        _id,
        name : newCompanyName,
        earn: newCompanyEarnings
    });
    console.log("COMPANYSTRING BEFORE" + companyString);
    let xhttp = new XMLHttpRequest();
    xhttp.open("post", "/api/company", true);
    xhttp.setRequestHeader('Content-type','application/json');
    xhttp.onload = function () {
        let report = JSON.parse(this.responseText);
        if (this.readyState == 4 && this.status == "200" && report.success) {
            companyNames.push(newCompanyName);

            deleteButton.onclick = deleteCompany;
            deleteButton.classList.remove("non-active-button");
            deleteButton.onfocus = undefined;
            addButton.onclick = addCompany;
            addButton.classList.remove("non-active-button");
            addButton.onfocus = undefined;


            updateEarningsPlusSubcompanyEarningsForParentCompanies(li, differenceInEarnings);

            tdCompanyName.innerHTML = newCompanyName;
            tdCompanyEarn.innerHTML = newCompanyEarnings;
            saveButton.replaceWith(editButton);
        } else {
            error.innerHTML = "<li>Failed to update company " + companyString + " to database." +
                 (report.cause ? report.cause : "") + "</li>";
        }
    };
    console.log("COMPANYSTRING AFTER" + companyString);
    xhttp.send(companyString);
}

function addCompanyToDataBaseAndAddItsTag(newCompanyId, newCompanyName, 
        newCompanyEarnings, liCompanyInput, parentCompanyId, liParentCompany) {

    let companyMDB = {
        "_id" : newCompanyId,
        "name" : newCompanyName,
        "earn" : newCompanyEarnings,
        "parent_company_id" : parentCompanyId
    };

    let companyMDBString= JSON.stringify(companyMDB);
    let xhttp = new XMLHttpRequest();
    xhttp.open("put", "/api/company", true);
    xhttp.setRequestHeader('Content-type','application/json');
    xhttp.onload = function () {
        console.log(this.responseText);
        let report = JSON.parse(this.responseText);
        if (this.readyState == 4 && this.status == "200" && report.success) {
            //console.log("Added company with id " + maxId + " successfully");
            companyNames.push(companyMDB.name);
            //console.log("Company names: " + companyNames);
            let company = {
                "_id" : newCompanyId,
                "name" : newCompanyName,
                "earn" : newCompanyEarnings,
                "earn_plus_subcomp_earn" : newCompanyEarnings,
                "subcompanies" : []
            };

            console.log("liParentCompany");
            console.log(liParentCompany);
            if(liParentCompany) {
                console.log("Updating parent companies");
                updateEarningsPlusSubcompanyEarningsForParentCompanies(liParentCompany, newCompanyEarnings);
            }

            let newLiCompany = createCompanyHTMLElement(company);
            liCompanyInput.replaceWith(newLiCompany);
            liCompanyInput.remove();

        } else {
            error.innerHTML = "<li>Failed to add company " + companyMDBString + " to database." +
                 (report.cause ? report.cause : "") + "</li>";
        }
    };
    xhttp.send(companyMDBString);
    // xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    // xhttp.send("fname=Henry&lname=Ford");
}

function addSubcompanyInputField(liCompany, companyId) {
    let ul = liCompany.lastElementChild;

    let li = addCompanyInputField(companyId, liCompany);

    ul.append(li);
}

function addCompanyInputField(companyId, liCompany){
    let li = document.createElement("li");
    console.log("####");
    console.log("companyID" + companyId);
    console.log("liCompany");
    console.log(liCompany);
    console.log("####");
    let table = document.createElement("table");

    let tr1 = document.createElement("tr");
    let td11 = document.createElement("td");
    let td12 = document.createElement("td");
    let td13 = document.createElement("td");
    tr1.appendChild(td11);
    tr1.appendChild(td12);
    tr1.appendChild(td13);
    let tr2 = document.createElement("tr");
    let td21 = document.createElement("td");
    let td22 = document.createElement("td");
    let td23 = document.createElement("td");
    tr2.appendChild(td21);
    tr2.appendChild(td22);
    tr2.appendChild(td23);

    table.appendChild(tr1);
    table.appendChild(tr2);
    
    td11.innerHTML = "Company name";
    let inputCompanyName = document.createElement("input");
    inputCompanyName.type = "text";
    inputCompanyName.value = "";
    td21.appendChild(inputCompanyName);
    
    td12.innerHTML = "Estimated earnings";
    let inputCompanyEarnings = document.createElement("input");
    inputCompanyEarnings.type = "number";
    inputCompanyEarnings.value = "";
    td22.appendChild(inputCompanyEarnings);

    let closeButton = document.createElement("button");
    closeButton.innerHTML = "X";
    closeButton.onclick = ()=> {
        li.remove();
    };
    td13.appendChild(closeButton);

    let createCompanyButton = document.createElement("button");
    createCompanyButton.innerHTML = "SUBMIT";
    createCompanyButton.onclick = ()=>{
        let inputValuesAreValid = 
            checkValidityOfInputValuesAndPrintErrorMessagesIfNeeded(inputCompanyEarnings, 
                inputCompanyName);
        if(!inputValuesAreValid){
            return;
        }
        
        maxId++;
        let newCompanyName = inputCompanyName.value.trim();
        let newCompanyEarnings = parseInt(inputCompanyEarnings.value);

        addCompanyToDataBaseAndAddItsTag(maxId, newCompanyName, newCompanyEarnings, li, companyId, liCompany);//companyMDB

    };
    td23.appendChild(createCompanyButton);

    li.appendChild(table);
    return li;
}




function checkValidityOfInputValuesAndPrintErrorMessagesIfNeeded(inputCompanyEarnings, 
        inputCompanyName) {

    let inputValuesAreValid = true;
    let errorMessage = "";
    let companyName = inputCompanyName.value.trim();
    if(inputCompanyEarnings.value == "") {
        inputValuesAreValid = false;
        errorMessage += "<li>Enter an integer for company earnings.</li>";
    } else if(inputCompanyEarnings.value.includes(".")) {
        inputValuesAreValid = false;
        errorMessage += "<li>" + inputCompanyEarnings.value + 
            " is not an integer. Enter an integer for company earnings.</li>";
    }
    if (companyName == "") {
        inputValuesAreValid = false;
        errorMessage += "<li>Enter a company name.</li>";
    } else if (companyNames.contains(companyName)) {
        inputValuesAreValid = false;
        errorMessage += "<li>Company name " + companyName + 
            " is already being used. Enter another company name.</li>";
    }
    // if(!inputValuesAreValid) {
    //     console.error(errorMessage);
    // }
    error.innerHTML = errorMessage;
    return inputValuesAreValid;
}

function updateEarningsPlusSubcompanyEarningsForParentCompanies(liCompany, companyEarnings) {
    let tdLiCompanyEstimatedEarnings = liCompany.children[0].children[0].children[2];
    tdLiCompanyEstimatedEarnings.innerHTML = 
        parseInt(tdLiCompanyEstimatedEarnings.innerHTML) + companyEarnings;
    let liParent = liCompany.parentElement.parentElement;
    if(liParent.tagName != "LI") {
        return;
    }
    updateEarningsPlusSubcompanyEarningsForParentCompanies(liParent, companyEarnings);
}
