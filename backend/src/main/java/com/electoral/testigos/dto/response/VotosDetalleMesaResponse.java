package com.electoral.testigos.dto.response;

import lombok.*;
import java.util.List;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class VotosDetalleMesaResponse {
    private Long mesaId;
    private Integer numeroMesa;
    private String puestoNombre;
    private String municipioNombre;
    private String testigoNombre;
    private String testigoCelular;
    private String testigoDocumento;
    private Long testigoId;

    private List<VotoRenglon> renglones;
    private List<FotoE14DTO> fotos;

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class VotoRenglon {
        private Long candidatoId;
        private String candidatoNombre;
        private String candidatoPartido;
        private Integer candidatoNumeroTarjeton;
        
        private Long tipoVotoId;
        private String tipoVotoCodigo;
        private String tipoVotoNombre;

        private Integer votosRegistraduria;
        private Integer votosTestigo;
        private Integer diferencia;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class FotoE14DTO {
        private Long id;
        private String origen;
        private String fechaSubida;
        private String subidoPorNombre;
    }
}
