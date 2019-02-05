const elasticSearch = require("./elasticSearch");

module.exports = class Buscador {

    constructor(parametrosEntrada, dataRedis) {
        this.parametrosEntrada = parametrosEntrada;
        this.dataRedis = dataRedis;
    }

    async ejecutar(){
        let body = elasticSearch.queryBuscador(this.parametrosEntrada, this.dataRedis);
        console.info("QUERY ES BUSCADOR:\n" + JSON.stringify(body));
        return elasticSearch.ejecutar(this.parametrosEntrada, body);
    }
}
