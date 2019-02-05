const elasticSearch = require("./elasticSearch");

module.exports = class Recomendacion {

    constructor(parametrosEntrada) {
        this.parametrosEntrada = parametrosEntrada;
    }

    async ejecutar() {
        let body = elasticSearch.queryRecomendacion(this.parametrosEntrada);
        console.info("QUERY ES RECOMENDACIONES:\n" + JSON.stringify(body));
        return elasticSearch.ejecutar(this.parametrosEntrada, body);
    }
}