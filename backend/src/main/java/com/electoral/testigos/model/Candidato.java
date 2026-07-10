package com.electoral.testigos.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "candidatos")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Candidato {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nombre;

    private String partido;

    @Column(name = "numero_tarjeton")
    private Integer numeroTarjeton;

    @Column(nullable = false)
    @Builder.Default
    private Boolean activo = true;
}
