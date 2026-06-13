package com.electoral.testigos.dto.response.distribucion;

import lombok.Builder;
import lombok.Data;
import java.util.List;

@Data
@Builder
public class DistribucionMunicipioResponse {
    private List<TestigoMovibleDTO> testigosMovibles;
    private List<PuestoNecesitadoDTO> puestosNecesitados;
}
