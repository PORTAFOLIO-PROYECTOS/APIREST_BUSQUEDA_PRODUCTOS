class parametrosEntrada {
    constructor(
        codigoPais,
        codigoCampania,
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
        diaFacturacion
    ) {
        this.codigoPais = codigoPais,
            this.codigoCampania = codigoCampania,
            this.codigoConsultora = codigoConsultora,
            this.codigoZona = codigoZona,
            this.cuv = cuv,
            this.codigoProducto = codigoProducto,
            this.cantidadProductos = cantidadProductos,
            this.personalizaciones = personalizaciones,
            this.sociaEmpresaria = sociaEmpresaria,
            this.suscripcionActiva = suscripcionActiva,
            this.mdo = mdo,
            this.rd = rd,
            this.rdi = rdi,
            this.rdr = rdr,
            this.diaFacturacion = diaFacturacion
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

module.exports = parametrosEntrada;