const request = require("sync-request");
const config = require("../../config");

var stockRepository = (function () {

    async function Validar(saps, iso) {
        let codigoProductos = saps.join("|");

        return new Promise((resolve) => {
            let peticion = request("POST", config.constantes.urlApiProl, {
                json: {
                    SAPs: codigoProductos,
                    ISOPais: iso
                }
            });
            resolve(JSON.parse(peticion.getBody("utf8")));
        });
    }

    return {
        Validar: Validar
    }

})();

module.exports = stockRepository;