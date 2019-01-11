"use strict";

require("newrelic");
const express = require("express");
const bodyParser = require("body-parser");
const morgan = require("morgan");
const config = require("./config");
const morganConfig = require("./app/utils/morganConfig");
const app = express();

// Captura de logging (info + error)
morgan.token("params", morganConfig.tokenParams);
morgan.token("messageError", morganConfig.tokenMessageError);
morgan.token("stackError", morganConfig.tokenStackError);
morgan.token("body", morganConfig.tokenBody);
app.use(morgan(morganConfig.formatCustom, {
    skip: morganConfig.skipCustom,
    stream: { write: morganConfig.streamWriteCustom }
}));

// Cargar enrutamiento 
const routeIndex = require("./app/routes/index");
app.use("/", routeIndex);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//#region 
const routeBuscador = require("./app/routes/buscador");
const routePersonalizacion = require("./app/routes/personalizacion");
const routeRecomendacion = require("./app/routes/recomendacion");
const routeCategoria = require("./app/routes/categoria");

app.use(config.app.endpoint.buscador, routeBuscador);
app.use(config.app.endpoint.personalizacion, routePersonalizacion);
app.use(config.app.endpoint.recomendacion, routeRecomendacion);
app.use(config.app.endpoint.categoria, routeCategoria);

//#endregion

// Manejo de errores
app.use(function(err, req, res, next) {
    err.status = err.status || 500;

    res.locals.message = err.message;
    res.locals.stack = err.stack;
    res.locals.error = err;

    res.status(err.status);
    res.json(err);

    next();
});

// Inicialización del servicio
app.listen(config.app.port, () => {
    console.log("Server is up and running on port numner " + config.app.port);
});