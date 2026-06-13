package com.electoral.testigos.dto.response.distribucion;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class MesaNecesitadaDTO {
    private Long mesaId;
    private Integer numeroMesa;
    private int ocupados;
    private int capacidad;
    private int faltantes;
}
