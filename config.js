"use strict";

const config = {
    name: "SBBuscador",
    ambiente: "QA",
    app: {
        port: 7777,
        endpoint: {
            buscador: "/buscador",
            personalizacion: "/personalizacion",
            recomendacion: "/recomendaciones",
            categoria: "/categoria"
        },
        newrelic_license_key: "694adcc764c2db2bd666f7872e0614f95278a20b"
    },
    elasticsearch: {
        host: "https://vpc-es-sbsearch-qas-u4pht5gehqu3pmsc4x5srachwu.us-east-1.es.amazonaws.com",
        index: "dev_producto",
        type: "_doc",
        log: ""
    },
    redis: {
        port: 6379,
        host: "ecconsultorasqa.ombwyy.0001.use1.cache.amazonaws.com",
        retries: 3,
        time_to_retry: 100,
        time_live: 86400 // tiempo de vida en segundos
    },
    sql: {
        BO: "Server=AWNTS74; Initial Catalog=BelcorpBolivia; User ID=sa; Password=C0n$ult0r@$;",
        CL: "Server=AWNTS74; Initial Catalog=BelcorpChile; User ID=sa; Password=C0n$ult0r@$;",
        CO: "Server=AWNTS74; Initial Catalog=BelcorpColombia; User ID=sa; Password=C0n$ult0r@$;",
        CR: "Server=AWNTS74; Initial Catalog=BelcorpCostaRica; User ID=sa; Password=C0n$ult0r@$;",
        EC: "Server=AWNTS74; Initial Catalog=BelcorpEcuador; User ID=sa; Password=C0n$ult0r@$;",
        SV: "Server=AWNTS74; Initial Catalog=BelcorpSalvador; User ID=sa; Password=C0n$ult0r@$;",
        GT: "Server=AWNTS74; Initial Catalog=BelcorpGuatemala; User ID=sa; Password=C0n$ult0r@$;",
        MX: "Server=AWNTS74; Initial Catalog=BelcorpMexico; User ID=sa; Password=C0n$ult0r@$;",
        PA: "Server=AWNTS74; Initial Catalog=BelcorpPanama; User ID=sa; Password=C0n$ult0r@$;",
        PE: "Server=AWNTS74; Initial Catalog=BelcorpPeru; User ID=sa; Password=C0n$ult0r@$;",
        PR: "Server=AWNTS74; Initial Catalog=BelcorpPuertoRico; User ID=sa; Password=C0n$ult0r@$;",
        DO: "Server=AWNTS74; Initial Catalog=BelcorpDominicana; User ID=sa; Password=C0n$ult0r@$;"
    },
    flags: {
        logicaShowRoom: true,
        logicaLanzamiento: true,
        logicaOPT: true,
        logicaODD: true,
        logicaGN: true,
        validacionStock: true
    },
    constantes: {
        urlImagenesSB: "https://cdn1-prd.somosbelcorp.com/",
        urlImagenesAppCatalogo: "https://s3-sa-east-1.amazonaws.com/appcatalogo/",
        urlApiProl: "http://internal-qaelb-webprol-182416748.us-east-1.elb.amazonaws.com:81/api/Pedido/ValidacionStock",
        Matriz: "Matriz",
        Personalizacion: ["GND", "LAN", "ODD", "OPM", "OPT", "PAD", "SR", "LIQ", "CAT", "HV"],
        consultoraX: "XXXXXXXXX",
        consultoraY: "YYYYYYYYY",
        consultora0: "000000000"
    },
    elasticLogging: {
        endpoint: "https://search-qas-atd-f5uoi2tmrjd2i7rtdhfglnr7le.us-west-2.es.amazonaws.com/",
        pattern: "qas-consultoras-ws-sbm-buscador-search-",
        type: "/LogEvent",
        application: "WebService",
        enabled: true
    }
};

module.exports = config;