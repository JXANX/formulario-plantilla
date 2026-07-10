package com.electoral.testigos.dto.response;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class UsuarioResponse {
    private Long id;
    private String nombre;
    private String correo;
    private String rol;
    private Boolean activo;
}
