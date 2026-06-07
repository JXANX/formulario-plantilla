package com.electoral.testigos.dto.request;

import com.electoral.testigos.model.enums.TipoTestigo;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class TestigoRequest {
    @NotBlank(message = "El documento es obligatorio")
    private String documento;

    @NotBlank(message = "El nombre es obligatorio")
    private String nombre;

    private String segundoNombre;

    @NotBlank(message = "El primer apellido es obligatorio")
    private String primerApellido;

    private String segundoApellido;

    @NotBlank(message = "El celular es obligatorio")
    private String celular;

    private String correo;

    @NotNull(message = "La mesa es obligatoria")
    private Long mesaId;

    @NotNull(message = "El tipo de testigo es obligatorio")
    private TipoTestigo tipoTestigo;
}
