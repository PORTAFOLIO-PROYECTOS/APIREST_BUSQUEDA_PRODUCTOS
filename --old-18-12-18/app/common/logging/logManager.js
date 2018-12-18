process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const request = require("sync-request");
const config = require("../../../config");

var logManager = function() {

    let getIndexName = function() {
        var today = new Date();
        var dd = today.getDate();
        var mm = today.getMonth() + 1;
        var yyyy = today.getFullYear();

        if (dd < 10) {
            dd = "0" + dd
        }

        if (mm < 10) {
            mm = "0" + mm
        }

        return config.elasticLogging.pattern + yyyy + "." + mm + "." + dd;
    };

    let addLog = function(logEvent) {
        try {
            logEvent.Application = config.elasticLogging.application;

            console.log("Logging:\n" + JSON.stringify(logEvent));

            if (config.elasticLogging.enabled === true) {
                let url = config.elasticLogging.endpoint + getIndexName() + "/LogEvent";
                request("POST", url, { json: logEvent });
            }

        } catch (error) {
            console.error("Logging: " + error);
        } finally {
            console.log("-----------------------------------------\n");
        }
    };

    return {
        addLog: addLog
    };
}();

module.exports = logManager;