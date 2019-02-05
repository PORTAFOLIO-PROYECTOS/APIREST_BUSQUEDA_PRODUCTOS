const parametrosEntrada = require("../models/personalizacion/parametros-entrada");
const personalizacionRepository = require("../repositories/personalizacion");

exports.obtener = function(req, res, next){
    let parametros = new parametrosEntrada(
        req.params.codigoPais,
        req.params.codigoCampania,
        req.params.codigoConsultora
    );

    console.info("Parametros API Personalizacion:\n" + JSON.stringify(parametros));

    var arreglo = [];
    var resultado = personalizacionRepository.obtener(parametros);

    resultado.then(function(resp){
        const resultados = resp.aggregations.unique_personalizacion.buckets;

        if (resultados.length > 0){
            for (let index = 0; index < resultados.length; index++) {
                const element = resultados[index];
                const source = element.key;
                arreglo.push(source);
            }
        } else {
            arreglo.push("XYZ");
        }

        res.json(arreglo.join(","));
        next();
    }, function (err){
        next(err);
    });
}
