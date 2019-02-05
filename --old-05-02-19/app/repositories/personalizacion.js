const elasticSearch = require("./elasticSearch");

var personalizacionRepository = (function(){

    function obtener(parametrosEntrada){
        let body = elasticSearch.queryPersonalizacion(parametrosEntrada);
        return elasticSearch.ejecutar(parametrosEntrada, body)
    }

    return {
        obtener: obtener
    }

})();
module.exports = personalizacionRepository;
