package com.electoral.testigos.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class LoginRequest {
    @NotBlank(message = "El usuario es obligatorio")
    private String correo;

    @NotBlank(message = "La contraseña es obligatoria")
    private String password;
}
