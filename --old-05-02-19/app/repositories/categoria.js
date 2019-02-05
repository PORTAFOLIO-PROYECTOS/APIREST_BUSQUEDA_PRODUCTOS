"use strict";

const elasticSearch = require("./elasticSearch");

module.exports = class Categoria {

    constructor(parametrosEntrada){
        this.parametrosEntrada = parametrosEntrada;
    }

    async ejecutar() {
        let body = elasticSearch.queryCategorias(this.parametrosEntrada);
        console.info("QUERY ES CATEGORIA:\n" + JSON.stringify(body));
        return elasticSearch.ejecutar(this.parametrosEntrada, body);
    }
}