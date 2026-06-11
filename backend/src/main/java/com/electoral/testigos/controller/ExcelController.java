package com.electoral.testigos.controller;

import com.electoral.testigos.dto.response.ApiResponse;
import com.electoral.testigos.service.ExcelExportService;
import com.electoral.testigos.service.ExcelImportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;

@RestController
@RequestMapping("/api/excel")
public class ExcelController {

    @Autowired
    private ExcelImportService excelImportService;

    @Autowired
    private ExcelExportService excelExportService;

    @PostMapping("/import")
    public ResponseEntity<?> importExcel(@RequestParam("file") MultipartFile file) {
        try {
            excelImportService.importarPlantilla(file.getInputStream(), false);
            return ResponseEntity.ok(new ApiResponse<>(true, "Archivo importado exitosamente", null));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse<>(false, "Error al importar el archivo: " + e.getMessage(), null));
        }
    }

    @GetMapping("/export")
    public ResponseEntity<Resource> exportExcel() {
        try {
            File file = excelExportService.exportarDatos();
            Resource resource = new FileSystemResource(file);

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + file.getName() + "\"")
                    .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                    .body(resource);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/export-cobertura")
    public ResponseEntity<Resource> exportCobertura(@RequestParam(required = false) Long departamentoId) {
        try {
            File file = excelExportService.exportarCobertura(departamentoId);
            Resource resource = new FileSystemResource(file);

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + file.getName() + "\"")
                    .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                    .body(resource);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/export-coordinadores")
    public ResponseEntity<Resource> exportCoordinadores(@RequestParam Long municipioId) {
        try {
            File file = excelExportService.exportarCoordinadores(municipioId);
            Resource resource = new FileSystemResource(file);

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + file.getName() + "\"")
                    .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                    .body(resource);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/export-testigos-municipio")
    public ResponseEntity<Resource> exportTestigosMunicipio(@RequestParam Long municipioId) {
        try {
            File file = excelExportService.exportarTestigosPorMunicipio(municipioId);
            Resource resource = new FileSystemResource(file);

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + file.getName() + "\"")
                    .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                    .body(resource);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
