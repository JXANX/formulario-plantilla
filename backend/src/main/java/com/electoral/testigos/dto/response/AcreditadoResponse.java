package com.electoral.testigos.dto.response;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class AcreditadoResponse {
    private Long id;
    private String documento;
    private String nombreCompleto;
    private String celular;
    private String correo;
    private String nombreOrganizacion;
    private String tipoTestigo;
    private String estado;
    private LocalDateTime fechaRegistro;
    
    // Ubicación
    private Long mesaId;
    private Integer numeroMesa;
    private Long puestoId;
    private String nombrePuesto;
    private Long municipioId;
    private String nombreMunicipio;
    private Long departamentoId;
    private String nombreDepartamento;
}
