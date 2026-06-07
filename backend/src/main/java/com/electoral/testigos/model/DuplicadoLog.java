package com.electoral.testigos.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "duplicados_log")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class DuplicadoLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    @Builder.Default
    private LocalDateTime fecha = LocalDateTime.now();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id")
    private Usuario usuario;

    @Column(name = "registro_original", columnDefinition = "TEXT")
    private String registroOriginal;

    @Column(name = "registro_ingresado", columnDefinition = "TEXT")
    private String registroIngresado;

    @Column(name = "tipo_duplicado")
    private String tipoDuplicado;

    @Column(name = "accion_tomada")
    private String accionTomada;
}
