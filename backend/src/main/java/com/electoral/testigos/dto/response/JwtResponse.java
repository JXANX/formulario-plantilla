package com.electoral.testigos.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class JwtResponse {
    private String token;
    private String type = "Bearer";
    private Long id;
    private String nombre;
    private String correo;
    private String rol;

    public JwtResponse(String token, Long id, String nombre, String correo, String rol) {
        this.token = token;
        this.id = id;
        this.nombre = nombre;
        this.correo = correo;
        this.rol = rol;
    }
}
