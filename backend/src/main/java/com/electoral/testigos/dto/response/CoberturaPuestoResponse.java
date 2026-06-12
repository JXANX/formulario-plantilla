package com.electoral.testigos.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CoberturaPuestoResponse {
    private Long puestoId;
    private String puestoNombre;
    private String zona;
    private Long municipioId;
    private String municipioNombre;
    private long totalMesas;
    private long mesasTotalmenteCubiertas;
    private long mesasParcialmenteCubiertas;
    private long mesasSinTestigo;
    private double porcentajeCobertura;
}
