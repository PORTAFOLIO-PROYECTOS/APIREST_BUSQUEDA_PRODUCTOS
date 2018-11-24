const config = require('../../config');
const mssql = require('mssql');

var sql = (function (){

    async function filtrosData(codigoPais){

        mssql.on('error', err => {
            console.dir(err);
            mssql.close();
        });

        const connectionString = config.sql[codigoPais.toUpperCase()];

        return new Promise((resolve, reject) => {
            mssql.connect(connectionString).then(pool => {
                return pool.request().query('SELECT TablaLogicaDatosID, Nombre, Descripcion, ValorMinimo, ValorMaximo FROM FiltroBuscador WHERE Estado = 1');
            }).then(result => {
                mssql.close();
                resolve(result.recordset);
            }).catch(err => {
                console.dir(err);
                mssql.close();
                reject(err);
            });
        });
    }

    return {
        filtrosData: filtrosData
    }
})();

module.exports = sql;