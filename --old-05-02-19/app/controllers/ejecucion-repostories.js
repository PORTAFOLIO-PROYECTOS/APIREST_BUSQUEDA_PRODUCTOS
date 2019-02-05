"use strict";

const buscadorRepository = require("../repositories/buscador"),
    stockRepository = require("../repositories/stock"),
    recomendacionRepository = require("../repositories/recomendacion"),
    categoriaRepository = require("../repositories/categoria"),
    config = require("../../config");

module.exports = class EjecucionesRepositories {

    constructor(parametros) {
        this.parametros = parametros;
    }

    /**
     * Ejecuta la query de ES
     * @param {array} rangosRedis - Datos de redis
     */
    async ejecutarQueryBuscador(dataRedis) {
        try {
            const buscador = new buscadorRepository(this.parametros, dataRedis);
            return new Promise((resolve, reject) => {
                buscador.ejecutar().then((resp) => { resolve(resp); }, (err) => {
                    console.log("Error: al consultar ES");
                    reject(err);
                });
            });
        } catch (error) {
            console.log("Error en ejecutarQueryBuscador", error);
            return [];
        }
    }

    /**
     * Ejecuta la query de ES
     */
    async ejecutarQueryRecomendacion() {
        try {
            const recomendacion = new recomendacionRepository(this.parametros);
            return new Promise((resolve, reject) => {
                recomendacion.ejecutar().then((resp) => { resolve(resp); }, (err) => {
                    console.log("Error: al consultar ES");
                    reject(err);
                });
            });
        } catch (error) {
            console.log("Error en ejecutarQueryRecomendacion", error);
            return [];
        }
    }

    /**
     * Ejecuta la query de ES
     */
    async ejecutarQueryCategoria() {
        try {
            const categoria = new categoriaRepository(this.parametros);
            return new Promise((resolve, reject) => {
                categoria.ejecutar().then((resp) => { resolve(resp); }, (err) => {
                    console.log("Error: al consultar ES");
                    reject(err);
                });
            });
        } catch (error) {
            console.log("Error en ejecutarQueryCategoria", error);
            return [];
        }
    }

    /**
     * Devuelve json de productos validados con el STOCK
     * @param {array} SAPs - Codigos SAPs a validar
     * @param {string} isoPais - ISO del país
     * @param {int} diaFacturacion - Día de facturación 
     * @param {array} productosES - Lista de productos a validar
     * @param {boolean} recomendados - Flag para validar si es una recomendación u otro
     */
    async validarStock(SAPs, isoPais, diaFacturacion, productosES, recomendados) {
        let productos = productosES;
        try {
            if (config.flags.validacionStock && diaFacturacion >= 0) {
                let dataStock = await stockRepository.Validar(SAPs, isoPais);
                for (const i in dataStock) {
                    for (const j in productos) {
                        if (dataStock[i].codsap === productos[j].SAP) {
                            productos[j].Stock = dataStock[i].estado === 1 ? true : false;
                            break;
                        }
                    }
                }

                if (recomendados) {
                    let array = [];
                    for (const key in productos) {
                        const element = productos[key];
                        if (element.Stock === true) {
                            array.push(element);
                        }
                    }
                    productos = array;
                }
            }

            return productos;
        } catch (error) {
            console.log("Error en validarStock", error);
            return productos;
        }
    }
}