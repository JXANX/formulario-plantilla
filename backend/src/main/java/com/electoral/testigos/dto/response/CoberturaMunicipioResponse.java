package com.electoral.testigos.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CoberturaMunicipioResponse {
    private Long municipioId;
    private String municipioNombre;
    private String codigoMunicipio;
    private Long departamentoId;
    private String departamentoNombre;
    private long totalMesas;
    private long mesasConTestigo;
    private long mesasSinTestigo;
    private double porcentajeCobertura;
}
