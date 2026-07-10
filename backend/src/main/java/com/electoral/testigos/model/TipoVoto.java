package com.electoral.testigos.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "tipos_voto")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class TipoVoto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nombre;

    @Column(nullable = false, unique = true)
    private String codigo;

    @Column(nullable = false)
    @Builder.Default
    private Boolean activo = true;
}
