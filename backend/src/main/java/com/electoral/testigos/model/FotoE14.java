package com.electoral.testigos.model;

import com.electoral.testigos.model.enums.OrigenFoto;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "fotos_e14")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class FotoE14 {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "mesa_id", nullable = false)
    private Mesa mesa;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OrigenFoto origen;

    @Column(name = "ruta_archivo")
    private String rutaArchivo;

    @Lob
    @Column(name = "archivo_data")
    private byte[] archivoData;

    @Column(name = "content_type")
    private String contentType;

    @Column(name = "fecha_subida", nullable = false)
    @Builder.Default
    private LocalDateTime fechaSubida = LocalDateTime.now();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subido_por_id")
    private Usuario subidoPor;
}
