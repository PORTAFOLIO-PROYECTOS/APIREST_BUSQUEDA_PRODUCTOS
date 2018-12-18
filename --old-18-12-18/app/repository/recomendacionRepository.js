const elasticSearchUtils = require("./elasticSearch");

var recomendacionRepository = (function() {

    async function buscar(parametrosEntrada) {
        let body = elasticSearchUtils.queryRecomendacion(parametrosEntrada);
        console.info("Query ES:\n" + JSON.stringify(body));
        return elasticSearchUtils.ejecutarElasticSearch(parametrosEntrada, body);
    }

    return {
        buscar: buscar
    };

})();

module.exports = recomendacionRepository;
