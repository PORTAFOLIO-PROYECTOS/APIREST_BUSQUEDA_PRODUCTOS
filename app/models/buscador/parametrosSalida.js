class parametrosSalida {
    constructor(
        CUV,
        SAP,
        Imagen,
        Descripcion,
        Valorizado,
        Precio,
        MarcaId,
        TipoPersonalizacion,
        CodigoEstrategia,
        CodigoTipoEstrategia,
        TipoEstrategiaId,
        LimiteVenta,
        Stock,
        EstrategiaID
    ) {
        this.CUV = CUV;
        this.SAP = SAP;
        this.Imagen = Imagen;
        this.Descripcion = Descripcion;
        this.Valorizado = Valorizado;
        this.Precio = Precio;
        this.MarcaId = MarcaId;
        this.TipoPersonalizacion = TipoPersonalizacion;
        this.CodigoEstrategia = CodigoEstrategia;
        this.CodigoTipoEstrategia = CodigoTipoEstrategia;
        this.TipoEstrategiaId = TipoEstrategiaId;
        this.LimiteVenta = LimiteVenta;
        this.Stock = Stock;
        this.EstrategiaID = EstrategiaID;
    }
}

module.exports = parametrosSalida;