module.exports = class ParametrosEntrada {
    constructor(
        codigoPais,
        codigoCampania,
        origen,
        codigoConsultora,
        codigoZona,
        cuv,
        codigoProducto,
        cantidadProductos,
        personalizaciones,
        sociaEmpresaria,
        suscripcionActiva,
        mdo,
        rd,
        rdi,
        rdr,
        diaFacturacion,
        mostrarProductoConsultado
    ) {
        this.codigoPais = codigoPais;
        this.codigoCampania = codigoCampania;
        this.origen = origen;
        this.codigoConsultora = codigoConsultora;
        this.codigoZona = codigoZona;
        this.cuv = cuv;
        this.codigoProducto = codigoProducto;
        this.cantidadProductos = cantidadProductos;
        this.personalizaciones = personalizaciones;
        this.sociaEmpresaria = sociaEmpresaria;
        this.suscripcionActiva = suscripcionActiva;
        this.mdo = mdo;
        this.rd = rd;
        this.rdi = rdi;
        this.rdr = rdr;
        this.diaFacturacion = diaFacturacion;
        this.mostrarProductoConsultado = mostrarProductoConsultado;
    }

    get fromValue() {
        return 0;
    }

    get sortValue() {
        let tipoOrdenamiento = "asc",
            json = `[{"codigoEstrategia":"${tipoOrdenamiento}"},{"ganancia":"${tipoOrdenamiento}"}]`;
        return JSON.parse(json);
    }
}