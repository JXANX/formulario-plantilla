package com.electoral.testigos.controller;

import com.electoral.testigos.dto.response.ApiResponse;
import com.electoral.testigos.dto.response.VotosDetalleMesaResponse;
import com.electoral.testigos.dto.response.VotosResumenResponse;
import com.electoral.testigos.model.Discrepancia;
import com.electoral.testigos.model.FotoE14;
import com.electoral.testigos.model.Usuario;
import com.electoral.testigos.repository.UsuarioRepository;
import com.electoral.testigos.service.VotosService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.nio.file.Files;
import java.util.List;

@RestController
@RequestMapping("/api/votos")
@PreAuthorize("isAuthenticated()")
public class VotosController {

    @Autowired
    private VotosService votosService;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @PostMapping("/registraduria")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'OPERARIO')")
    public ResponseEntity<?> registrarRegistraduria(
            @RequestParam Long mesaId,
            @RequestParam(required = false) Long candidatoId,
            @RequestParam Long tipoVotoId,
            @RequestParam Integer votos) {
        try {
            votosService.registrarVotosRegistraduria(mesaId, candidatoId, tipoVotoId, votos);
            return ResponseEntity.ok(new ApiResponse<>(true, "Voto de la Registraduría registrado correctamente", null));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse<>(false, e.getMessage(), null));
        }
    }

    @PostMapping("/testigo")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'OPERARIO')")
    public ResponseEntity<?> registrarTestigo(
            @RequestParam Long mesaId,
            @RequestParam(required = false) Long candidatoId,
            @RequestParam Long tipoVotoId,
            @RequestParam Integer votos,
            @RequestParam(required = false) Long testigoId) {
        try {
            votosService.registrarVotosTestigo(mesaId, candidatoId, tipoVotoId, votos, testigoId);
            return ResponseEntity.ok(new ApiResponse<>(true, "Voto del Testigo registrado correctamente", null));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse<>(false, e.getMessage(), null));
        }
    }

    @PostMapping("/fotos/subir")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'OPERARIO')")
    public ResponseEntity<?> subirFoto(
            @RequestParam("file") MultipartFile file,
            @RequestParam("mesaId") Long mesaId,
            @RequestParam("origen") String origen,
            Authentication authentication) {
        try {
            String correo = authentication.getName();
            Usuario usuario = usuarioRepository.findByCorreo(correo)
                    .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
            FotoE14 foto = votosService.guardarFotoE14(mesaId, origen, file, usuario);
            return ResponseEntity.ok(new ApiResponse<>(true, "Foto subida exitosamente", foto.getId()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse<>(false, "Error al subir archivo: " + e.getMessage(), null));
        }
    }

    @GetMapping("/fotos/ver/{id}/archivo")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'OPERARIO', 'ABOGADO')")
    public ResponseEntity<Resource> verArchivoFoto(@PathVariable Long id) {
        try {
            File file = votosService.obtenerArchivoFoto(id);
            Resource resource = new FileSystemResource(file);
            String contentType = Files.probeContentType(file.toPath());
            if (file.getName().toLowerCase().endsWith(".pdf")) {
                contentType = "application/pdf";
            } else if (contentType == null) {
                contentType = "image/jpeg";
            }
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .body(resource);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/discrepancias")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ABOGADO')")
    public ResponseEntity<?> obtenerDiscrepancias() {
        try {
            List<Discrepancia> discrepancias = votosService.obtenerDiscrepanciasActivas();
            return ResponseEntity.ok(new ApiResponse<>(true, "Discrepancias obtenidas", discrepancias));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse<>(false, e.getMessage(), null));
        }
    }

    @GetMapping("/resumen")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'ABOGADO', 'OPERARIO')")
    public ResponseEntity<?> obtenerResumen() {
        try {
            VotosResumenResponse resumen = votosService.obtenerResumenConteo();
            return ResponseEntity.ok(new ApiResponse<>(true, "Resumen obtenido", resumen));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse<>(false, e.getMessage(), null));
        }
    }

    @GetMapping("/mesa/{mesaId}/detalle")
    public ResponseEntity<?> obtenerDetalleMesa(@PathVariable Long mesaId) {
        try {
            VotosDetalleMesaResponse detalle = votosService.obtenerDetalleMesa(mesaId);
            return ResponseEntity.ok(new ApiResponse<>(true, "Detalle de mesa obtenido", detalle));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse<>(false, e.getMessage(), null));
        }
    }
}
