const elasticSearch = require("./elasticSearch");

var recomendacionRepository = (function() {

    async function buscar(parametrosEntrada) {
        let body = elasticSearch.queryRecomendacion(parametrosEntrada);
        console.info("Query ES:\n" + JSON.stringify(body));
        return elasticSearch.ejecutar(parametrosEntrada, body);
    }

    return {
        buscar: buscar
    };

})();

module.exports = recomendacionRepository;
