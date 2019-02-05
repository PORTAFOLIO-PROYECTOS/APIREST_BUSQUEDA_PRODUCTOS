const config = require("../../config");
const mssql = require("mssql");

// example => https://hugorocaproyectos.js.org/blog/2019-01-10-conexi%C3%B3n-nodejs-con-sqlserver/

module.exports = class SqlDatos {
    constructor(isoPais) {
        this.isoPais = isoPais;
    }

    connect() {
        mssql.on("error", err => {
            console.dir(err);
            mssql.close();
        });

        const connectionString = config.sql[this.isoPais.toUpperCase()];

        return mssql.connect(connectionString);
    }

    async execStoreProcedure(storeProcedure) {        
        return new Promise((resolve, reject) => {
            let exec = this.connect().then(pool => { return pool.request().execute(storeProcedure); });
            exec.then(result => {
                mssql.close();
                resolve(result.recordset);
            }).catch(err => {
                console.log(err);
                mssql.close();
                reject(err);
            });
        });
    }

    async listaBusqueda() {
        return await this.execStoreProcedure("[dbo].[BuscadorFiltros_Lista]");
    }

    async listaCategoria() {
        return await this.execStoreProcedure("[dbo].[BuscadorFiltros_ListaCategorias]");
    }
}