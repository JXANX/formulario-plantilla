package com.electoral.testigos.model;

import jakarta.persistence.*;
import lombok.*;
import java.util.ArrayList;
import java.util.List;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Table(name = "puestos", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"municipio_id", "codigo_puesto", "zona"})
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Puesto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "municipio_id", nullable = false)
    @JsonIgnore
    private Municipio municipio;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "coordinador_id")
    private Testigo coordinador;

    @Column(name = "codigo_puesto", nullable = false)
    private String codigoPuesto;

    @Column(name = "nombre_puesto", nullable = false)
    private String nombrePuesto;

    @Column(nullable = false)
    private String zona;

    @OneToMany(mappedBy = "puesto", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    @JsonIgnore
    private List<Mesa> mesas = new ArrayList<>();
}
