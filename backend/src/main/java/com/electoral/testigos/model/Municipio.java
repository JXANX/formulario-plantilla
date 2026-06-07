package com.electoral.testigos.model;

import jakarta.persistence.*;
import lombok.*;
import java.util.ArrayList;
import java.util.List;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Table(name = "municipios", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"departamento_id", "codigo_municipio"})
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Municipio {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "departamento_id", nullable = false)
    @JsonIgnore
    private Departamento departamento;

    @Column(name = "codigo_municipio", nullable = false)
    private String codigoMunicipio;

    @Column(nullable = false)
    private String nombre;

    @OneToMany(mappedBy = "municipio", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    @JsonIgnore
    private List<Puesto> puestos = new ArrayList<>();
}
