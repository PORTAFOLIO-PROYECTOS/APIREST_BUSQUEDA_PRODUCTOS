const elasticSearchUtils = require('../common/elasticSearch');

var personalizacion = (function(){

    function obtener(parametrosEntrada){
        let body = elasticSearchUtils.QueryPersonalizacion(parametrosEntrada);
        return elasticSearchUtils.ejecutarElasticSearch(parametrosEntrada, body)
    }

    return {
        obtener: obtener
    }

})();
module.exports = personalizacion;
