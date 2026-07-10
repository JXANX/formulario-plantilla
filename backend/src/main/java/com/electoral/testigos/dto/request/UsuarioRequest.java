package com.electoral.testigos.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class UsuarioRequest {
    @NotBlank(message = "El nombre es obligatorio")
    private String nombre;

    @NotBlank(message = "El correo/usuario es obligatorio")
    private String correo;

    private String password;

    @NotBlank(message = "El rol es obligatorio")
    private String rol;

    private Boolean activo;
}
