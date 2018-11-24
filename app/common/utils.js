const config = require('../../config');

var utils = (function() {

    var urlSB = config.constantes.urlImagenesSB;
    var urlAPP = config.constantes.urlImagenesAppCatalogo;
    var matriz = config.constantes.Matriz + '/';
    // var listaPersonalizacion = config.constantes.Personalizacion;

    function getUrlImagen(nombre, paisISO, origen, campania, marcaId){
        
        if (nombre == undefined || nombre == null) return "no_tiene_imagen.jpg";
        if (!nombre.length) return "no_tiene_imagen.jpg";

        if (nombre.startsWith("http")){
            return nombre;
        }
        if (nombre.startsWith("https")){
            return nombre;
        }

        if (origen == 1){
            return urlSB + matriz + paisISO + '/' + nombre;
        }

        if (origen == 2){
            let marcas = ['L','E','C'];

            let splited = nombre.split('|');

            if (splited.length > 1){
                return urlAPP + splited[0] + '/' + splited[1]  + '/' + marcas[marcaId -1] + '/productos/' + splited[2];
            }

            return urlAPP + paisISO + '/' + campania + '/' + marcas[marcaId -1] + '/productos/' + nombre;
        }
    }

    function isDummy(listaPersonalizacion, tipoPersonalizacion){
        if (typeof listaPersonalizacion === 'undefined' || listaPersonalizacion == '') return false;
        if (listaPersonalizacion == 'XYZ') return true;
        var response = listaPersonalizacion.indexOf(tipoPersonalizacion);
        return !(response > -1);
    }

    function decodeText (str) {
        return str.replace(/&#(\d+);/g, function (match, dec) {
            return String.fromCharCode(dec);
        });
    }

    function selectInArray(array, value){
        let result = [];
        for (const key in array) {
            const element = array[key];
            if (element.TablaLogicaDatosID == value) {
                result.push(element);
            }
        }
        return result;
    }

    return {
        getUrlImagen: getUrlImagen,
        isDummy: isDummy,
        decodeText: decodeText,
        selectInArray: selectInArray
    };

})();

module.exports = utils;