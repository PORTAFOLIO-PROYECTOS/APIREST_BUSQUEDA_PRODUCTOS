class parametrosEntrada {
    constructor(
        codigoPais,
        codigoCampania,
        codigoConsultora,
        codigoZona,
        textoBusqueda,
        cantidadProductos,
        sociaEmpresaria,
        suscripcionActiva,
        mdo,
        rd,
        rdi,
        rdr,
        diaFacturacion,
        personalizaciones,
        numeroPagina,
        ordenCampo,
        ordenTipo,
        filtroCategoria,
        filtroMarca,
        filtroPrecio
    ) {
        this.codigoPais = codigoPais;
        this.codigoCampania = codigoCampania;
        this.codigoConsultora = codigoConsultora;
        this.codigoZona = codigoZona;
        this.textoBusqueda = textoBusqueda;
        this.cantidadProductos = cantidadProductos;
        this.sociaEmpresaria = sociaEmpresaria;
        this.suscripcionActiva = suscripcionActiva;
        this.mdo = mdo;
        this.rd = rd;
        this.rdi = rdi;
        this.rdr = rdr;
        this.diaFacturacion = diaFacturacion;
        this.personalizaciones = personalizaciones;
        this.numeroPagina = numeroPagina;
        this.ordenCampo = ordenCampo;
        this.ordenTipo = ordenTipo;
        this.filtroCategoria = filtroCategoria,
        this.filtroMarca = filtroMarca,
        this.filtroPrecio = filtroPrecio 
    }

    get fromValue(){
        return (this.cantidadProductos * this.numeroPagina);
    }

    get sortValue(){
        var campo = "orden";
        var tipoOrdenamiento = "asc";
        if(this.ordenCampo && this.ordenCampo.length > 0)
            campo = this.ordenCampo.toLowerCase();

        if(this.ordenTipo && this.ordenTipo.length > 0)
            tipoOrdenamiento = this.ordenTipo.toLowerCase();
            
        var json = "[{ '" + campo + "': '" + tipoOrdenamiento + "'}]";
        return JSON.parse(json);
    }
}

module.exports = parametrosEntrada;