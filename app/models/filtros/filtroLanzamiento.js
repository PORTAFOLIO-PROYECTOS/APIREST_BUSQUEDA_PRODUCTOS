const config = require('../../../config');

var filtroLanzamiento = (function() {

    /**
     * En caso que la condición cumpla retornará un array sin el dato LAN
     * @param {array} parametros - Parametros que recibe la aplicación
     * @param {array} personalizacion - Personalizaciones que tiene la consultora
     */
    function filtrar(parametros, personalizacion) {
        if (!config.flags.logicaLanzamiento) return personalizacion;

        if (parametros.suscripcionActiva == '0' || parametros.suscripcionActiva.toLowerCase() == 'false') {
            return personalizacion.filter(per => per != 'LAN');
        }

        return personalizacion;
    }

    return {
        filtrar: filtrar
    };

})();

module.exports = filtroLanzamiento;