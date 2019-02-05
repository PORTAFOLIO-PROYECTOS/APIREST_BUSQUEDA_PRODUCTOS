module.exports = class ParametrosEntrada {
    constructor(
        codigoPais,
        codigoCampania,
        codigoConsultora,
        codigoZona,
        sociaEmpresaria,
        suscripcionActiva,
        mdo,
        rd,
        rdi,
        rdr,
        diaFacturacion,
        personalizaciones
    ){
        this.codigoPais = codigoPais;
        this.codigoCampania = codigoCampania;
        this.codigoConsultora = codigoConsultora;
        this.codigoZona = codigoZona;
        this.sociaEmpresaria = sociaEmpresaria;
        this.suscripcionActiva = suscripcionActiva;
        this.mdo = mdo;
        this.rd = rd;
        this.rdi = rdi;
        this.rdr = rdr;
        this.diaFacturacion = diaFacturacion;
        this.personalizaciones = personalizaciones;   
    }
}