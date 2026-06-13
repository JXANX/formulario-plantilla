package com.electoral.testigos.dto.response.distribucion;

import lombok.Builder;
import lombok.Data;
import java.util.List;

@Data
@Builder
public class PuestoNecesitadoDTO {
    private Long puestoId;
    private String nombrePuesto;
    private String zona;
    private List<MesaNecesitadaDTO> mesas;
}
