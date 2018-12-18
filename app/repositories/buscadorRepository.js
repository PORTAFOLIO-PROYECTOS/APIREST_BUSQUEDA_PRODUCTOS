const elasticSearchUtils = require("./elasticSearch");

var buscadorRepository = (function() {

    async function buscar(parametrosEntrada, dataRedis) {
        let body = elasticSearchUtils.queryBuscador(parametrosEntrada, dataRedis);
        console.info("Query ES:\n" + JSON.stringify(body));
        return elasticSearchUtils.ejecutarElasticSearch(parametrosEntrada, body);
    }

    return {
        buscar: buscar
    };

})();

module.exports = buscadorRepository;
