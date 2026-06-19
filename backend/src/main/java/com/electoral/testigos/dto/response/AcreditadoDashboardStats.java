package com.electoral.testigos.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AcreditadoDashboardStats {
    private long totalAcreditados;
    private long totalMunicipios;
    private long totalPuestos;
    private long totalMesas;
    
    // Semáforo Acreditados
    private long mesasVerdes;
    private long mesasAmarillas;
    private long mesasRojas;
    private long mesasCubiertas; // Verde + Amarillo
    private long mesasPendientes; // Rojas
    private double porcentajeCobertura;

    // Comparación Manual vs Acreditados (Ganados / Perdidos / Confirmados)
    private long mesasGanadas;       // mesas con >=1 acreditado y 0 manuales
    private long mesasPerdidas;      // mesas con 0 acreditados y >=1 manuales
    private long mesasConfirmadas;   // mesas con >=1 acreditado y >=1 manuales
    private long totalTestigosManuales;
}
