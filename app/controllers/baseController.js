const redis = require("../common/redis"),
    sql = require("../common/sql");

var baseController = (function () {

    function obtenerDatosRedis(key, isoPais) {
        let dataRedis = await redis.getRedis(key);
        if (dataRedis == null || dataRedis == "") {
            //- Consulta en SQLServer
            let resultSql = JSON.stringify(await sql.filtrosData(isoPais));
            //- Inserción de la consulta en REDIS
            let setRedis = await redis.setRedis(name, resultSql);
            if (!setRedis) return false;
            dataRedis = resultSql;
        }
        return JSON.parse(dataRedis);
    }

    return {
        obtenerDatosRedis: obtenerDatosRedis
    }
})();

module.exports = baseController;