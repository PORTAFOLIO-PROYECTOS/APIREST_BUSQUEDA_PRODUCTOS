const elasticSearchUtils = require('../common/elasticSearch');

var buscador = (function() {

    async function buscar(parametrosEntrada, rangosRedis) {

        let body = elasticSearchUtils.QueryBuscador(parametrosEntrada, rangosRedis);

        console.info("Query ES:\n" + JSON.stringify(body));

        return elasticSearchUtils.ejecutarElasticSearch(parametrosEntrada, body);
    }

    return {
        buscar: buscar
    };

})();

module.exports = buscador;