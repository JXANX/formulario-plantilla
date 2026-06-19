package com.electoral.testigos.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ComparativaTestigoResponse {
    private Long idTestigo;
    private String documento;
    private String nombreCompleto;
    private String celular;
    private String correo;
    
    // Ubicación en la planeación (Testigo manual)
    private Long mesaId;
    private Integer numeroMesa;
    private Long puestoId;
    private String nombrePuesto;
    private Long municipioId;
    private String nombreMunicipio;
    
    // Cruzamiento
    private boolean fueAcreditado;
}
