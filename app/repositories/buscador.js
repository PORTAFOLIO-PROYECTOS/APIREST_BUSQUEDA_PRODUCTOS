const elasticSearch = require("./elasticSearch");

var buscadorRepository = (function() {

    async function buscar(parametrosEntrada, dataRedis) {
        let body = elasticSearch.queryBuscador(parametrosEntrada, dataRedis);
        console.info("Query ES:\n" + JSON.stringify(body));
        return elasticSearch.ejecutar(parametrosEntrada, body);
    }

    return {
        buscar: buscar
    };

})();

module.exports = buscadorRepository;