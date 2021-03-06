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
     * @param {array} CUVs - Codigos SAPs a validar
     * @param {array} productosES - Lista de productos a validar
     * @param {boolean} recomendados - Flag para validar si es una recomendación u otro
     */
    async validarStock(CUVs, productosES, recomendados) {
        const stock = new stockRepository();
        let productos = productosES;

        try {
            if (config.flags.validacionStock && this.parametros.diaFacturacion >= 0) {
                let dataStock = await stock.validar(this.parametros.codigoPais, this.parametros.codigoCampania, CUVs);
                for (const i in dataStock) {
                    for (const j in productos) {
                        if (dataStock[i].coD_VENTA_PADRE === productos[j].CUV) {
                            productos[j].Stock = dataStock[i].stock === 1 ? true : false;
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