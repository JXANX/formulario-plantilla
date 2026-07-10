package com.electoral.testigos.dto.response;

import lombok.*;
import java.util.List;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class VotosResumenResponse {
    private long totalMesas;
    private long mesasReportadasRegistraduria;
    private long mesasReportadasTestigo;
    private long mesasConDiscrepancias;
    private long totalDiscrepanciasActivas;

    private List<ResumenMunicipio> municipios;
    private List<ResumenOperario> operarios;

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class ResumenMunicipio {
        private Long municipioId;
        private String municipioNombre;
        private long totalMesas;
        private long reportadasRegistraduria;
        private long reportadasTestigo;
        private long conDiscrepancias;
        private double porcentajeAvance;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class ResumenOperario {
        private Long operarioId;
        private String operarioNombre;
        private long mesasAsignadas;
        private long reportadasRegistraduria;
        private long reportadasTestigo;
        private long conDiscrepancias;
    }
}
