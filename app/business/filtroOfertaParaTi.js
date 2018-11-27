const config = require("../../config");
const utils = require("../common/utils");

var filtroOfertaParaTi = (function () {

    /**
     * En caso que la condición cumpla retornará un array sin el dato LAN
     * @param {array} parametros - Parametros que recibe la aplicación
     * @param {array} personalizacion - Personalizaciones que tiene la consultora
     * @param {json} filtro - return de array con las condiciones de OPT
     */
    function filtrar(parametros, personalizacion, filtro) {

        if (!config.flags.logicaOPT) return personalizacion;

        let must = [],
            consultoraX = config.constantes.consultoraX,
            consultoraY = config.constantes.consultoraY,
            consultora0 = config.constantes.consultora0,
            RD = (parametros.rd === "1" || parametros.rd.toLowerCase() === "true") ? true : false,
            SuscripcionActiva = (parametros.suscripcionActiva === "1" || parametros.suscripcionActiva.toLowerCase() === "true") ? true : false,
            MDO = (parametros.mdo === "1" || parametros.mdo.toLowerCase() === "true") ? true : false,
            RDI = (parametros.rdi === "1" || parametros.rdi.toLowerCase() === "true") ? true : false,
            isDummyOPM = utils.isDummy(parametros.personalizaciones, "OPM"),
            isDummyPAD = utils.isDummy(parametros.personalizaciones, "PAD");

        if (isDummyOPM && isDummyPAD) {
            must.push({ terms: { "codigoConsultora": [consultoraX, consultoraY] } });
        } else {
            must.push({ terms: { "codigoConsultora": [parametros.codigoConsultora, consultoraY, consultora0] } });
        }

        if (RD && MDO && SuscripcionActiva) {
            return personalizacion.filter(per => per !== "OPT");
        }

        if (RD && MDO && !SuscripcionActiva) {

            must.push({ terms: { "tipoPersonalizacion": ["OPM", "PAD"] } });
            must.push({ term: { "revistaDigital": "0" } });

            filtro.push({ bool: { must } });

            personalizacion = personalizacion.filter(per => per !== "OPM");
            personalizacion = personalizacion.filter(per => per !== "PAD");
            return personalizacion.filter(per => per !== "OPT");

        }

        if (RD && !MDO && SuscripcionActiva) {
            return personalizacion.filter(per => per !== "OPT");
        }

        if (RD && !MDO && !SuscripcionActiva) {
            personalizacion = personalizacion.filter(per => per !== "OPM");
            return personalizacion.filter(per => per !== "PAD");
        }

        if (RDI) {
            personalizacion = personalizacion.filter(per => per !== "OPM");
            return personalizacion.filter(per => per !== "PAD");
        }

        return personalizacion;
    }

    return {
        filtrar: filtrar
    };

})();

module.exports = filtroOfertaParaTi;