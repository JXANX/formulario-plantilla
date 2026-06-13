package com.electoral.testigos.dto.response.distribucion;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class TestigoMovibleDTO {
    private Long id;
    private String nombreCompleto;
    private String documento;
    private Long mesaOrigenId;
    private Integer numeroMesaOrigen;
    private Long puestoOrigenId;
    private String nombrePuestoOrigen;
}
