package com.electoral.testigos.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "discrepancias", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"mesa_id", "candidato_id", "tipo_voto_id"})
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Discrepancia {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "mesa_id", nullable = false)
    private Mesa mesa;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "candidato_id")
    private Candidato candidato;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tipo_voto_id", nullable = false)
    private TipoVoto tipoVoto;

    @Column(name = "votos_registraduria", nullable = false)
    @Builder.Default
    private Integer votosRegistraduria = 0;

    @Column(name = "votos_testigo", nullable = false)
    @Builder.Default
    private Integer votosTestigo = 0;

    @Column(nullable = false)
    private Integer diferencia;

    @Column(nullable = false)
    @Builder.Default
    private Boolean resuelta = false;
}
