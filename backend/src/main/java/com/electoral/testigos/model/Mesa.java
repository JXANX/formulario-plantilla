package com.electoral.testigos.model;

import jakarta.persistence.*;
import lombok.*;
import java.util.ArrayList;
import java.util.List;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Table(name = "mesas", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"puesto_id", "numero_mesa"})
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Mesa {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "puesto_id", nullable = false)
    @JsonIgnore
    private Puesto puesto;

    @Column(name = "numero_mesa", nullable = false)
    private Integer numeroMesa;

    @Column(nullable = false)
    @Builder.Default
    private Integer capacidad = 2;

    @Column(nullable = false)
    @Builder.Default
    private Integer ocupados = 0;

    @OneToMany(mappedBy = "mesa", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    @JsonIgnore
    private List<Testigo> testigos = new ArrayList<>();

    /**
     * Retorna el estado semáforo de la mesa.
     * ROJO = 0 testigos, AMARILLO = 1 testigo, VERDE = 2+ testigos
     */
    @Transient
    public String getEstadoSemaforo() {
        if (ocupados == 0) return "ROJO";
        if (ocupados == 1) return "AMARILLO";
        return "VERDE";
    }

    public boolean tieneDisponibilidad() {
        return ocupados < capacidad;
    }
}
