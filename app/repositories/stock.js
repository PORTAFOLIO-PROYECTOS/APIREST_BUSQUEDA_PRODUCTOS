const request = require("sync-request");
const config = require("../../config");

module.exports = class Stock {
    async validar(isoPais, campaniaId, CUVs){
        let valCUVs = CUVs.join("|");
        return new Promise((resolve) => {
            let peticion = request("POST", config.constantes.urlApiProl, {
                json: {
                    paisISO: isoPais,
                    campaniaID: campaniaId,
                    listaCUVs: valCUVs,
                    flagDetalle: 0
                }
            });
            resolve(JSON.parse(peticion.getBody("utf8")));
        })
    }
}