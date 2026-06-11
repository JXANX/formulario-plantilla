package com.electoral.testigos.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class DashboardStats {
    private long totalTestigos;
    private long totalMunicipios;
    private long totalPuestos;
    private long totalMesas;
    private long mesasVerdes;
    private long mesasAmarillas;
    private long mesasRojas;
    private long mesasCubiertas; // Para compatibilidad (Verde + Amarillo)
    private long mesasPendientes; // Para compatibilidad (Rojas)
    private long testigosFaltantes;
    private long mesasFaltantesCompletas; // Amarillas + Rojas (les falta al menos 1 testigo)
    private long mesasSinNingunTestigo;   // Solo Rojas (completamente vacías)
    private double porcentajeCobertura;
}
