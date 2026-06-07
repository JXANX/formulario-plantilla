package com.electoral.testigos.dto.response;

import com.electoral.testigos.model.enums.TipoTestigo;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class TestigoResponse {
    private Long id;
    private String documento;
    private String nombre;
    private String segundoNombre;
    private String primerApellido;
    private String segundoApellido;
    private String nombreCompleto;
    private String celular;
    private String correo;
    private String nombreOrganizacion;
    private TipoTestigo tipoTestigo;
    private LocalDateTime fechaRegistro;
    
    // Location Details
    private Long mesaId;
    private Integer numeroMesa;
    private Long puestoId;
    private String nombrePuesto;
    private Long municipioId;
    private String nombreMunicipio;
    private Long departamentoId;
    private String nombreDepartamento;
    
    private String registradoPor;
}
