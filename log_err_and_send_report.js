"use strict"

function logErrorAndSendReport(err, res) {
    console.error(err.stack);
    res.send({
        success : false,
        cause : err.name + " : " + err.message
    });
}

module.exports = {
    logErrorAndSendReport
};
