const config = require("../../config"),
    utils = require("../common/utils"),
    filtroShowroom = require("../business/filtroShowRoom"),
    filtroLanzamiento = require("../business/filtroLanzamiento"),
    filtroOfertaParaTi = require("../business/filtroOfertaParaTi"),
    filtroOfertaDelDia = require("../business/filtroOfertaDelDia"),
    filtroGuiaNegocioDigital = require("../business/filtroGuiaNegocioDigital"),
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
    function ejecutarElasticSearch(parametros, body) {
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
        }
        ];
    }

    /**
     * Devuelve un json con los datos de los filtros
     * @param {array} parametros - Parametros de entrada que recibe la aplicación
     * @param {json} retorno - Retorna json con la query de los filtros
     */
    function queryFiltros(parametros, retorno) {
        let must = [], // Contenedor de los resultados (Y)
            categorias = [],
            marcas = [],
            preciosFiltros = [],
            filtroCategoria = parametros.filtroCategoria,
            filtroMarca = parametros.filtroMarca,
            filtroPrecio = parametros.filtroPrecio;

        if (filtroCategoria.length > 0) {
            for (const i in filtroCategoria) {
                const element = filtroCategoria[i];
                categorias.push({
                    term: {
                        "categorias.keyword": element.nombreFiltro
                    }
                });
            }
            must.push({
                bool: {
                    should: categorias
                }
            });
        }

        if (filtroMarca.length > 0) {
            for (const i in filtroMarca) {
                const element = filtroMarca[i];
                marcas.push({
                    term: {
                        "marcas.keyword": element.nombreFiltro
                    }
                });
            }
            must.push({
                bool: {
                    should: marcas
                }
            });
        }

        if (filtroPrecio.length > 0) {
            for (const i in filtroPrecio) {
                const element = filtroPrecio[i];
                let precio = [];
                if (element.min > 0 && element.max > 0) precio.push({
                    from: element.min,
                    to: element.max
                });
                else {
                    if (element.max > 0) precio.push({
                        to: element.max
                    });
                    if (element.min > 0) precio.push({
                        from: element.min
                    });
                }

                if (precio.length > 0) {
                    preciosFiltros.push({
                        range: {
                            precio
                        }
                    });
                }
            }
            must.push({
                bool: {
                    should: preciosFiltros
                }
            });
        }

        retorno.push({
            bool: {
                "must": must
            }
        });
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
     * @param {array} personalizaciones - Personalizaiones que tiene la consultora
     * @param {*} retorno - JSON con las condiciones y consultora Dummy
     */
    function queryPersonalizacionesYCondiciones(parametros, personalizaciones, retorno) {
        let should = [];

        personalizaciones = filtroShowroom.filtrar(parametros, personalizaciones, should);
        personalizaciones = filtroOfertaParaTi.filtrar(parametros, personalizaciones, should);
        personalizaciones = filtroOfertaDelDia.filtrar(parametros, personalizaciones, should);
        personalizaciones = filtroLanzamiento.filtrar(parametros, personalizaciones);
        personalizaciones = filtroGuiaNegocioDigital.filtrar(parametros, personalizaciones);

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
        let ranges = [];
        let preciosRedis = utils.selectInArray(dataRedis, config.constantes.codigoFiltroPrecio);
        if (preciosRedis.length > 0) {
            for (const i in preciosRedis) {
                const element = preciosRedis[i];
                let inRange = "{'key':'"+ element.Nombre + "'";
                if (element.ValorMinimo > 0) inRange += ",'from':'" + element.ValorMinimo + "'";
                if (element.ValorMaximo > 0) inRange += ",'to':'" + element.ValorMaximo + "'";
                inRange += "}";
                ranges.push(JSON.parse(inRange));
            }
        }

        return {
            categoriasFiltro: {
                terms: {
                    "field": "categorias.keyword"
                }
            },
            marcasFiltro: {
                terms: {
                    "field": "marcas.keyword"
                }
            },
            preciosFiltro: {
                range: {
                    "field": "precio",
                    ranges
                }

            }
        };
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
    function queryNegaciones(parametrosEntrada) {
        return [{
            bool: {
                must: [{
                    terms: {
                        "zonasAgotadas": [parametrosEntrada.codigoZona]
                    }
                }]
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

        queryFiltros(parametrosEntrada, must);
        queryPersonalizacionesYCondiciones(parametrosEntrada, personalizaciones, must);

        let aggregation = queryAggregation(dataRedis);
        let multi_match = queryMultiMatch(parametrosEntrada.textoBusqueda);
        let must_not = queryNegaciones(parametrosEntrada);

        return {
            from: parametrosEntrada.fromValue,
            size: parametrosEntrada.cantidadProductos,
            sort: parametrosEntrada.sortValue,
            query: {
                bool: {
                    "must": multi_match,
                    "must_not": must_not,
                    filter: must
                }
            },
            "aggregations": aggregation
        };
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
        ejecutarElasticSearch: ejecutarElasticSearch
    };

})();

module.exports = elasticSearch;