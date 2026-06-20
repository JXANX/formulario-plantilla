package com.electoral.testigos.model;

import jakarta.persistence.*;
import lombok.*;
import com.fasterxml.jackson.annotation.JsonIgnore;
import java.time.LocalDateTime;

@Entity
@Table(name = "acreditados", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"documento"})
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Acreditado {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String documento;

    @Column(name = "nombre_completo", nullable = false)
    private String nombreCompleto;

    private String celular;

    private String correo;

    @Column(name = "nombre_organizacion")
    private String nombreOrganizacion;

    @Column(name = "tipo_testigo")
    private String tipoTestigo;

    private String estado;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "mesa_id", nullable = false)
    @JsonIgnore
    private Mesa mesa;

    @Column(name = "fecha_registro", nullable = false)
    @Builder.Default
    private LocalDateTime fechaRegistro = LocalDateTime.now();
}
