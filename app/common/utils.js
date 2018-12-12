const config = require("../../config");

var utils = (function () {

    /**
     * Devuelve ruta y nombre de la imagen
     * @param {string} nombre - Nombre de la imagen
     * @param {string} paisISO - Codigo del país
     * @param {Int} origen - viene de ES
     * @param {string} campania - Codigo campania
     * @param {Int} marcaId - Codigo marca del producto
     */
    function getUrlImagen(nombre, paisISO, origen, campania, marcaId) {
        let urlSB = config.constantes.urlImagenesSB,
            urlAPP = config.constantes.urlImagenesAppCatalogo,
            matriz = config.constantes.Matriz + "/";

        if (nombre === undefined || nombre === null) return "no_tiene_imagen.jpg";
        if (!nombre.length) return "no_tiene_imagen.jpg";

        if (nombre.startsWith("http")) {
            return nombre;
        }
        if (nombre.startsWith("https")) {
            return nombre;
        }

        if (origen === 1) {
            return urlSB + matriz + paisISO + "/" + nombre;
        }

        if (origen === 2) {
            let marcas = ["L", "E", "C"];

            let splited = nombre.split("|");

            if (splited.length > 1) {
                return urlAPP + splited[0] + "/" + splited[1] + "/" + marcas[marcaId - 1] + "/productos/" + splited[2];
            }

            return urlAPP + paisISO + "/" + campania + "/" + marcas[marcaId - 1] + "/productos/" + nombre;
        }
    }

    /**
     * Devuelve true/false 
     * @param {array} listaPersonalizacion - Lista de personalizaciones
     * @param {string} tipoPersonalizacion - Personalización a validar
     */
    function isDummy(listaPersonalizacion, tipoPersonalizacion) {
        if (typeof listaPersonalizacion === "undefined" || listaPersonalizacion === "") return false;
        if (listaPersonalizacion === "XYZ") return true;
        var response = listaPersonalizacion.indexOf(tipoPersonalizacion);
        return !(response > -1);
    }

    /**
     * Devuel el texto convetido a UTF8
     * @param {string} str - Texto códificado
     */
    function decodeText(str) {
        return str.replace(/&#(\d+);/g, function (match, dec) {
            return String.fromCharCode(dec);
        });
    }

    /**
     * Devuelve array con los datos encontrados
     * @param {array} array - array donde se realizará la busqueda
     * @param {string} value - valor que se buscará
     */
    function selectInArray(array, value) {
        let result = [];
        for (const key in array) {
            const element = array[key];
            if (element.TablaLogicaDatosID === value) {
                result.push(element);
            }
        }
        return result;
    }

    /**
     * Devuelve objeto validado
     * @param {object} val - Parametro de entrada para evitar caidas
     */
    function validarFiltro(val) {
        let array = [];
        if (val === null) return array;
        if (val.length > 0) {
            if (val.indexOf(null) >= 0) return array;
        }
        return val;
    }

    function distinctInArrayRedis(data) {
        let result = [],
            map = new Map();

        for (const item of data) {
            if (!map.has(item.TablaLogicaDatosId)){
                map.set(item.TablaLogicaDatosId, true);
                result.push({
                    id: item.TablaLogicaDatosId,
                    filtro: item.CampoES,
                    tipo: item.TipoOperadorES
                });
            }
        }

        return result;
    }

    return {
        getUrlImagen: getUrlImagen,
        isDummy: isDummy,
        decodeText: decodeText,
        selectInArray: selectInArray,
        validarFiltro: validarFiltro,
        distinctInArrayRedis: distinctInArrayRedis
    };

})();

module.exports = utils;