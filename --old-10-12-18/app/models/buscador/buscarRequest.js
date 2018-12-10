class buscarRequest {
    constructor (
        codigoPais,
        codigoCampania,
        codigoConsultora,
        codigoZona,
        textoBusqueda,
        configuracion,
        personalizaciones,
        paginacion,
        orden,
        filtros
    ) {
        this.codigoPais = codigoPais;
        this.codigoCampania = codigoCampania;
        this.codigoConsultora = codigoConsultora;
        this.codigoZona = codigoZona;
        this.textoBusqueda = textoBusqueda;
        this.configuracion = configuracion;
        this.personalizaciones = personalizaciones;
        this.paginacion = paginacion;
        this.orden = orden;
        this.filtros = filtros;
    }
}

module.exports = buscarRequest;