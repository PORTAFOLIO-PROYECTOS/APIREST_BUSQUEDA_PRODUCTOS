const config = require("../../config");
const logEvent = require("./logging/logEvent");
const logManager = require("./logging/logManager");

var morganConfig = function() {

    let formatoParamatroPais = "codigoPais";
    let formatoParamatroOrigen = "origen";
    let formatCustom = ":date[clf]、:method、:url、:params、:status、:res[content-length]、:response-time、:messageError、:stackError、:remote-addr、:body";

    function tokenParams(req) {
        return req.route.path;
    }

    function tokenMessageError(req, res) {
        if (res.locals) {
            return res.locals.message;
        }
        return "";
    }

    function tokenStackError(req, res) {
        if (res.locals) {
            return res.locals.stack;
        }
        return "";
    }

    function tokenBody(req) {
        if (req.body) {
            return JSON.stringify(req.body);
        }
        return "";
    }

    function skipCustom(req, res) {
        return res.statusCode === 404;
    }

    function streamWriteCustom(str) {
        try {
            //console.log("Log:\n" + str);
            let datos = str.split("、");

            if (datos) {
                //let date = datos[0];
                let method = datos[1];
                let url = datos[2];
                let paramsFormat = datos[3];
                let status = datos[4];
                let resContentLength = datos[5];
                let responseTime = datos[6];
                let messageError = datos[7];
                let stackError = datos[8];
                let remoteAddr = datos[9];
                let body = datos[10];

                let endpoint = "";

                for (let k in config.app.endpoint) {
                    if (url.toLowerCase().startsWith(config.app.endpoint[k])) {
                        endpoint = config.app.endpoint[k];
                        break;
                    }
                }
                if (endpoint === "") return;

                let parametersFormatArray = paramsFormat.split("/:");
                let parametersValues = url.substring(endpoint.length, url.length);
                let parametersValuesArray = parametersValues.split("/");
                let formatRoute = "";
                let codigoPais = "";
                let origen = "";
                for (let index = 0; index < parametersFormatArray.length; index++) {
                    const element1 = parametersFormatArray[index];
                    const element2 = parametersValuesArray[index];

                    if (!element1 && !element2) continue;

                    if (element2) {
                        formatRoute += element1 + "=" + element2 + ";";

                        if (element1.toLowerCase().startsWith(formatoParamatroPais.toLowerCase())) {
                            codigoPais = element2;
                        }

                        if (element1.toLowerCase().startsWith(formatoParamatroOrigen.toLowerCase())) {
                            origen = element2;
                        }
                    } else {
                        formatRoute += element1 + "=;";
                    }
                }

                if (messageError) {
                    messageError = formatRoute;
                }


                if (body) {
                    formatRoute += "body=" + body.replace("\n", "");
                }

                let level = "INFO";
                if (status !== "200") {
                    level = "ERROR";
                }

                let log = new logEvent(
                    level,
                    method + " " + endpoint,
                    endpoint,
                    formatRoute,
                    messageError,
                    parseInt(responseTime),
                    codigoPais,
                    stackError,
                    parseInt(resContentLength),
                    remoteAddr.replace("\n", ""),
                    origen
                );

                logManager.addLog(log);
            }
        } catch (error) {
            console.error("Log-morgan:\n" + error);
        }
    }

    return {
        tokenParams: tokenParams,
        tokenMessageError: tokenMessageError,
        tokenStackError: tokenStackError,
        tokenBody: tokenBody,
        formatCustom: formatCustom,
        skipCustom: skipCustom,
        streamWriteCustom: streamWriteCustom
    };

}();

module.exports = morganConfig;