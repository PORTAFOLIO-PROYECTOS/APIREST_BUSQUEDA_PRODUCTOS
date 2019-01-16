"use strict";

const elasticSearch = require("./elasticSearch");

module.exports = class CategoriaRepository {
    async ejecutar(parametrosEntrada) {
        let body = elasticSearch.queryCategorias(parametrosEntrada);
        console.info("Query ES:\n" + JSON.stringify(body));
        return elasticSearch.ejecutar(parametrosEntrada, body);
    }
}