package com.electoral.testigos.model;

import com.electoral.testigos.model.enums.TipoTestigo;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "testigos", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"documento"})
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Testigo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String documento;

    @Column(nullable = false)
    private String nombre;

    @Column(name = "segundo_nombre")
    private String segundoNombre;

    @Column(name = "primer_apellido", nullable = false)
    private String primerApellido;

    @Column(name = "segundo_apellido")
    private String segundoApellido;

    @Column(nullable = false)
    private String celular;

    private String correo;

    @Column(name = "nombre_organizacion")
    private String nombreOrganizacion;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_testigo", nullable = false)
    private TipoTestigo tipoTestigo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "mesa_id", nullable = false)
    private Mesa mesa;

    @Column(name = "fecha_registro", nullable = false)
    @Builder.Default
    private LocalDateTime fechaRegistro = LocalDateTime.now();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_registro_id")
    private Usuario usuarioRegistro;

    /** Helper to get full name */
    @Transient
    public String getNombreCompleto() {
        StringBuilder sb = new StringBuilder(nombre);
        if (segundoNombre != null && !segundoNombre.isBlank()) {
            sb.append(" ").append(segundoNombre);
        }
        sb.append(" ").append(primerApellido);
        if (segundoApellido != null && !segundoApellido.isBlank()) {
            sb.append(" ").append(segundoApellido);
        }
        return sb.toString();
    }
}
