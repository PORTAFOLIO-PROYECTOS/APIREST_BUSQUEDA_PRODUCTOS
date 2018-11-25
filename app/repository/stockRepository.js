const request = require('sync-request');
const config = require('../../config');

var stockRepository = (function () {

    async function Validar(_saps, _iso) {
        _saps = _saps.join('|');

        return new Promise((resolve, reject) => {
            let peticion = request('POST', config.constantes.urlApiProl, {
                json: {
                    SAPs: _saps,
                    ISOPais: _iso
                }
            });
            resolve(JSON.parse(peticion.getBody('utf8')));
        });
    }

    return {
        Validar: Validar
    }

})();

module.exports = stockRepository;