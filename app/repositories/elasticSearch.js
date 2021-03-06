const config = require("../../config"),
    utils = require("../utils/utils"),
    filtroShowroom = require("./filtros/show-room"),
    filtroLanzamiento = require("./filtros/lanzamiento"),
    filtroOfertaParaTi = require("./filtros/oferta-para-ti"),
    filtroOfertaDelDia = require("./filtros/oferta-del-dia"),
    filtroGuiaNegocioDigital = require("./filtros/guia-negocio-digital"),
    client = require("elasticsearch").Client({
        host: `${config.elasticsearch.host}`,
        log: `${config.elasticsearch.log}`
    });

var elasticSearch = (function () {

    /**
     * Ejecuta la consulta que se envía hacia ES
     * @param {array} parametros - Parametros de entrada que recibe la aplicación
     * @param {json} body - Cuerpo de la consulta que se va ejecutar en ES
     */
    function ejecutar(parametros, body) {
        let indexName = `${config.elasticsearch.index}_${parametros.codigoPais.toLowerCase()}_${parametros.codigoCampania}`;
        let typeName = config.elasticsearch.type;
        return client.search({
            index: indexName,
            type: typeName,
            body: body
        });
    }

    /**
     * Retorna JSON con parametros necesarios
     */
    function queryParametrosEnDuro() {
        return [{
            term: {
                "activo": true
            }
        },
        {
            range: {
                "precio": {
                    "gt": 0
                }
            }
        }];
    }

    /**
     * Devuelve un json con los datos de los filtros
     * @param {array} parametros - Parametros de entrada que recibe la aplicación
     * @param {array} dataRedis - Datos de Redis
     * @param {json} retorno - Retorna json con la query de los filtros
     */
    function queryFiltros(parametros, dataRedis, retorno) {
        if (parametros.filtro.length === 0) return;

        let filtrosRedis = utils.distinctInArrayRedis(dataRedis),
            must = [];

        for (const key in parametros.filtro) {
            const element = parametros.filtro[key];
            const filtros = element.Opciones;
            const configSeccion = filtrosRedis.find(x => x.nombre === element.NombreGrupo);

            if (configSeccion) {
                const valores = [];
                const ranges = [];
                for (const i in filtros) {
                    const fila = filtros[i];
                    if (configSeccion.tipo === "term") {
                        valores.push({
                            term: {
                                [configSeccion.filtro]: fila.NombreFiltro
                            }
                        });
                    }

                    if (configSeccion.tipo === "range") {
                        if (fila.Min > 0 && fila.Max > 0) {
                            ranges.push({
                                from: fila.Min,
                                to: fila.Max
                            });
                        } else {
                            if (fila.Max > 0) ranges.push({ to: fila.Max });
                            if (fila.Min > 0) ranges.push({ from: fila.Min });
                        }

                        if (ranges.length > 0) {
                            valores.push({ range: { [configSeccion.filtro]: ranges } });
                        }
                    }
                }

                must.push({
                    bool: {
                        should: valores
                    }
                });
            }
        }

        if (must) {
            retorno.push({
                bool: {
                    must: must
                }
            });
        }
    }

    /**
     * Funcion para validar las personalizaciones
     * @param {array} parametros - Parametros que recibe el API
    * @param {array} personalizaciones - Array de personalizaciones que tiene la consultora
     * @param {json} should - ByRef de la consulta, esto realizará un push
     */
    function queryPersonalizaciones(parametros, personalizaciones, should) {
        let consultoraX = config.constantes.consultoraX,
            consultoraY = config.constantes.consultoraY,
            consultora0 = config.constantes.consultora0;

        personalizaciones.forEach(element => {

            let isDummy = utils.isDummy(parametros.personalizaciones, element);
            let must_dummy = [];

            if (isDummy) {

                must_dummy.push({
                    term: {
                        "tipoPersonalizacion": element
                    }
                });

                if (element === "CAT" || element === "LIQ" || element === "HV") {
                    must_dummy.push({
                        term: {
                            "codigoConsultora": consultora0
                        }
                    });
                } else {
                    must_dummy.push({
                        terms: {
                            "codigoConsultora": [consultoraX, consultoraY]
                        }
                    });
                }

                should.push({
                    bool: {
                        "must": must_dummy
                    }
                });

            } else {
                must_dummy.push({
                    term: {
                        "tipoPersonalizacion": element
                    }
                });
                must_dummy.push({
                    terms: {
                        "codigoConsultora": [parametros.codigoConsultora, consultoraY, consultora0]
                    }
                });

                should.push({
                    bool: {
                        "must": must_dummy
                    }
                });
            }
        });
    }

    /**
     * Arma el query que contiene la validación de la consultora Dummy y las condiciones de ODD, OPT, SR, GN y LAN
     * @param {array} parametros - Parametros que recibe el API
     * @param {array} dummyPersonalizaciones - Personalizaiones que tiene la consultora
     * @param {*} retorno - JSON con las condiciones y consultora Dummy
     */
    function queryPersonalizacionesYCondiciones(parametros, dummyPersonalizaciones, retorno, recomendaciones) {
        let should = [],
            personalizaciones = dummyPersonalizaciones;

        personalizaciones = filtroShowroom.filtrar(parametros, personalizaciones, should);
        personalizaciones = filtroOfertaParaTi.filtrar(parametros, personalizaciones, should);
        personalizaciones = filtroOfertaDelDia.filtrar(parametros, personalizaciones, should);
        personalizaciones = filtroLanzamiento.filtrar(parametros, personalizaciones);
        if (!recomendaciones) personalizaciones = filtroGuiaNegocioDigital.filtrar(parametros, personalizaciones);

        queryPersonalizaciones(parametros, personalizaciones, should);

        retorno.push({
            bool: {
                should
            }
        });
    }

    /**
     * Retorna un json con los aggregation para los filtros
     * @param {array} dataRedis - Precios del cache de REDIS
     */
    function queryAggregation(dataRedis) {
        if (dataRedis.length === 0) return [];

        let filtros = utils.distinctInArrayRedis(dataRedis),
            resultado = "{",
            i = 0,
            j = 0;

        for (const key in filtros) {
            const item = filtros[key];
            if (i > 0) resultado += ",";
            if (item.tipo === "term") {
                resultado += `"${item.nombre}-${item.id}": { "terms": { "field": "${item.filtro}" }}`;
            }

            if (item.tipo === "range") {
                const filterInSeccion = utils.selectInArray(dataRedis, item.id);
                resultado += `"${item.nombre}-${item.id}": { "range": { "field": "${item.filtro}", "ranges": [`;
                for (const y in filterInSeccion) {
                    if (j > 0) resultado += ",";
                    const filter = filterInSeccion[y];
                    resultado += `{"key":"${filter.FiltroNombre}"`;
                    if (filter.ValorMinimo > 0) resultado += `,"from": "${filter.ValorMinimo}"`;
                    if (filter.ValorMaximo > 0) resultado += `,"to": "${filter.ValorMaximo}"`;
                    resultado += "}";
                    j++;
                }
                resultado += "]}}";
            }
            i++;
        }

        resultado += "}";

        return JSON.parse(resultado);
    }

    /**
     * Devuelve un json con los analizadores
     * @param {string} texto - Texto de busqueda
     */
    function queryMultiMatch(texto) {
        let textConverted = utils.decodeText(texto);
        return [{
            multi_match: {
                query: textConverted,
                type: "cross_fields",
                fields: [
                    "textoBusqueda.ngram",
                    "cuv",
                    "categorias.ngram",
                    "grupoArticulos.ngram",
                    "lineas.ngram",
                    "marcas.ngram"
                ],
                "operator": "and"
            }
        }];
    }

    /**
     * Retorna json con lo que se quiere negar en la consulta
     */
    function queryNegaciones(parametrosEntrada, recomendaciones) {
        let origen = parametrosEntrada.origen === undefined ? "" : parametrosEntrada.origen.toLowerCase();
        let must = [
            {
                terms: {
                    "zonasAgotadas": [parametrosEntrada.codigoZona]
                }
            }
        ];

        if (recomendaciones) {
            must.push(
                {
                    term: { "tipoPersonalizacion": "GND" }
                },
                {
                    term: { "tipoPersonalizacion": "LIQ" }
                }
            );

            if (origen !== "sb-mobile") {
                must.push({
                    term: { "tipoPersonalizacion": "CAT" }
                });
            } else {
                if (!parametrosEntrada.mostrarProductoConsultado) {
                    must.push({
                        term: { "tipoPersonalizacion": "CAT" }
                    });
                }
            }
        }

        return [{
            bool: {
                must
            }
        }];
    }

    /**
     * Devuelve query que se ejecutará en ES
     * @param {array} parametrosEntrada - Parametros de entrada que recibe el API
     * @param {json} dataRedis - Datos obtenidos desde REDIS
     */
    function queryBuscador(parametrosEntrada, dataRedis) {
        let personalizaciones = config.constantes.Personalizacion,
            must = queryParametrosEnDuro();

        queryFiltros(parametrosEntrada, dataRedis, must);
        queryPersonalizacionesYCondiciones(parametrosEntrada, personalizaciones, must, false);

        let aggregation = queryAggregation(dataRedis);
        let multi_match = parametrosEntrada.textoBusqueda === "" || parametrosEntrada.textoBusqueda === null ? [] : queryMultiMatch(parametrosEntrada.textoBusqueda);

        return {
            from: parametrosEntrada.fromValue,
            size: parametrosEntrada.cantidadProductos,
            sort: parametrosEntrada.sortValue,
            query: {
                bool: {
                    "must": multi_match,
                    filter: must
                }
            },
            "aggregations": aggregation
        };
    }

    /**
     * Arma la consulta de es que ejecutará recomendaciones
     * @param {array} parametrosEntrada - Parametros que recibe el API
     */
    function queryRecomendacion(parametrosEntrada) {
        let personalizaciones = config.constantes.Personalizacion,
            must = queryParametrosEnDuro(),
            origen = parametrosEntrada.origen === undefined ? "" : parametrosEntrada.origen.toLowerCase();

        let parametrosPersonalizacion = personalizaciones.filter(per => per !== "GND");
        parametrosPersonalizacion = parametrosPersonalizacion.filter(per => per !== "LIQ");

        if (origen !== "sb-mobile") {
            parametrosPersonalizacion = parametrosPersonalizacion.filter(per => per !== "CAT");
        } else {
            if (!parametrosEntrada.mostrarProductoConsultado) {
                parametrosPersonalizacion = parametrosPersonalizacion.filter(per => per !== "CAT");
            }
        }

        queryPersonalizacionesYCondiciones(parametrosEntrada, parametrosPersonalizacion, must, true);

        let must_not = queryNegaciones(parametrosEntrada, true);

        return {
            from: parametrosEntrada.fromValue,
            size: 20,
            sort: parametrosEntrada.sortValue,
            query: {
                bool: {
                    "must": {
                        bool: {
                            should: [
                                { term: { "cuv": parametrosEntrada.cuv } },
                                { terms: { "codigoProductos": [parametrosEntrada.codigoProducto] } }
                            ]
                        }
                    },
                    "must_not": must_not,
                    filter: must
                }
            }
        };
    }

    /**
     * Construye la consulta que devolvera las categorías agrupadas
     * @param {array} parametrosEntrada - Parametros de entrada que recibe el API
     */
    function queryCategorias(parametrosEntrada) {

        let personalizaciones = config.constantes.Personalizacion,
            must = queryParametrosEnDuro();

        queryPersonalizacionesYCondiciones(parametrosEntrada, personalizaciones, must, false);

        let must_not = queryNegaciones(parametrosEntrada, false);

        return {
            query: {
                bool: {
                    "must_not": must_not,
                    filter: must
                }
            },
            aggs: {
                unique_categoria: {
                    terms: {
                        field: "categorias.keyword"
                    }
                }
            }
        }
    }

    function queryPersonalizacion(parametrosEntrada) {
        return {
            size: parametrosEntrada.cantidadProductos,
            query: {
                bool: {
                    must: [{
                        term: {
                            "codigoConsultora": parametrosEntrada.codigoConsultora
                        }
                    }]
                }
            },
            aggs: {
                unique_personalizacion: {
                    terms: {
                        field: "tipoPersonalizacion"
                    }
                }
            }
        }
    }

    return {
        queryBuscador: queryBuscador,
        queryPersonalizacion: queryPersonalizacion,
        queryRecomendacion: queryRecomendacion,
        queryCategorias: queryCategorias,
        ejecutar: ejecutar
    };

})();

module.exports = elasticSearch;