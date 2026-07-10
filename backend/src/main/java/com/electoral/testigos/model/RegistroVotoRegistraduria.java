package com.electoral.testigos.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "registro_votos_registraduria", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"mesa_id", "candidato_id", "tipo_voto_id"})
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class RegistroVotoRegistraduria {

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

    @Column(nullable = false)
    private Integer votos;
}
