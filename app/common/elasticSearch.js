const config = require('../../config'),
    utils = require('../common/utils'),
    filtroShowroom = require('../models/filtros/filtroShowRoom'),
    filtroLanzamiento = require('../models/filtros/filtroLanzamiento'),
    filtroOfertaParaTi = require('../models/filtros/filtroOfertaParaTi'),
    filtroOfertaDelDia = require('../models/filtros/filtroOfertaDelDia'),
    filtroGuiaNegocioDigital = require('../models/filtros/filtroGuiaNegocioDigital'),
    client = require('elasticsearch').Client({
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
     * Devuelve un json con los datos de los filtros
     * @param {array} parametros - Parametros de entrada que recibe la aplicación
     */
    function queryFiltros(parametros) {
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
                    term: { "categorias.keyword": element.nombreFiltro }
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
                    term: { "marcas.keyword": element.nombreFiltro }
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
                if (element.min > 0 && element.max > 0) precio.push({ from: element.min, to: element.max });
                else {
                    if (element.max > 0) precio.push({ to: element.max });
                    if (element.min > 0) precio.push({ from: element.min });
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
        return must;
    }

    function QueryBuscador(parametrosEntrada, preciosRedis) {

        let consultoraX = config.constantes.consultoraX,
            consultoraY = config.constantes.consultoraY,
            consultora0 = config.constantes.consultora0,
            personalizaciones = config.constantes.Personalizacion,
            should = [],
            must_not = [],
            must = [
                { term: { "activo": true } },
                { range: { "precio": { "gt": 0 } } }
            ];

        let textConverted = utils.decodeText(parametrosEntrada.textoBusqueda);
        //aqui va los filtros
        let filtroPush = queryFiltros(parametros);

        must.push(
            {
                bool: {
                    'must': filtroPush
                }
            }
        );
        //#endregion

        //#region condiciones filtros

        if (config.flags.logicaODD) {
            personalizaciones = filtroOfertaDelDia.filtrar(parametrosEntrada, personalizaciones, should);
        }

        if (config.flags.logicaGN) {
            personalizaciones = filtroGuiaNegocioDigital.filtrar(parametrosEntrada, personalizaciones);
        }

        personalizaciones.forEach(element => {

            let isDummy = utils.isDummy(parametrosEntrada.personalizaciones, element);
            let must_dummy = [];

            if (isDummy) {

                must_dummy.push({ term: { "tipoPersonalizacion": element } });

                if (element == 'CAT' || element == 'LIQ' || element == 'HV') {
                    must_dummy.push({ term: { "codigoConsultora": consultora0 } });
                } else {
                    must_dummy.push({ terms: { "codigoConsultora": [consultoraX, consultoraY] } });
                }

                should.push({ bool: { 'must': must_dummy } });

            } else {
                must_dummy.push({ term: { "tipoPersonalizacion": element } });
                must_dummy.push({ terms: { "codigoConsultora": [parametrosEntrada.codigoConsultora, consultoraY, consultora0] } });

                should.push({ bool: { 'must': must_dummy } });
            }

            //console.log("Element: " + element + " | IsDummy: " + isDummy);

        });
        //#endregion

        must.push(
            {
                bool: {
                    should
                }
            }
        );

        must_not.push({
            bool: {
                must: [
                    { terms: { "zonasAgotadas": [parametrosEntrada.codigoZona] } },
                ]
            }
        });

        //#region agregation precio
        //- aggregations
        let ranges = [];
        if (preciosRedis.length > 0) {
            for (const i in preciosRedis) {
                const element = preciosRedis[i];
                let inRange = '{"key":"' + element.Nombre + '"';
                if (element.ValorMinimo > 0) inRange += ',"from":' + element.ValorMinimo;
                if (element.ValorMaximo > 0) inRange += ',"to":' + element.ValorMaximo;
                inRange += '}';
                ranges.push(JSON.parse(inRange));
            }
        }
        //#endregion

        return {
            from: parametrosEntrada.fromValue,
            size: parametrosEntrada.cantidadProductos,
            sort: parametrosEntrada.sortValue,
            query: {
                bool: {
                    must: [
                        {
                            multi_match: {
                                query: textConverted,
                                type: 'cross_fields',
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
                        }
                    ],
                    must_not: {
                        bool: {
                            must: [
                                { terms: { "zonasAgotadas": [parametrosEntrada.codigoZona] } },
                            ]
                        }
                    },
                    filter: [
                        must
                    ]
                }
            },
            aggregations: {
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
            }
        };
    }

    function QueryPersonalizacion(parametrosEntrada) {
        return {
            size: parametrosEntrada.cantidadProductos,
            query: {
                bool: {
                    must: [
                        { term: { "codigoConsultora": parametrosEntrada.codigoConsultora } }
                    ]
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
        QueryBuscador: QueryBuscador,
        QueryPersonalizacion: QueryPersonalizacion,
        ejecutarElasticSearch: ejecutarElasticSearch
    };

})();

module.exports = elasticSearch;