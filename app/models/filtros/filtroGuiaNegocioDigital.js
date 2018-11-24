var filtroGuiaNegocioDigital = (function () {

    function filtrar(parametrosEntrada, personalizacion) {

        if (parametrosEntrada.sociaEmpresaria == '1' || parametrosEntrada.sociaEmpresaria.toLowerCase() == 'true') {
            return personalizacion.filter(per => per != 'GND'); 
        }

        if ((parametrosEntrada.sociaEmpresaria == '0' || parametrosEntrada.sociaEmpresaria.toLowerCase() == 'false') && 
            (parametrosEntrada.suscripcionActiva == '1' || parametrosEntrada.suscripcionActiva.toLowerCase() == 'true')) {

                return personalizacion.filter(per => per != 'GND'); 
        }

        return personalizacion; 
    }

    return {
        filtrar: filtrar
    };

})();

module.exports = filtroGuiaNegocioDigital;