package com.electoral.testigos.dto.response;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AsignacionResponse {
    private Long id;
    private UsuarioDTO operario;
    private MesaDTO mesa;

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class UsuarioDTO {
        private Long id;
        private String nombre;
        private String correo;
        private String rol;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class MesaDTO {
        private Long id;
        private Integer numeroMesa;
        private PuestoDTO puesto;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class PuestoDTO {
        private Long id;
        private String nombrePuesto;
        private MunicipioDTO municipio;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class MunicipioDTO {
        private Long id;
        private String nombre;
    }
}
