package com.electoral.testigos.controller;

import com.electoral.testigos.dto.request.TestigoRequest;
import com.electoral.testigos.dto.response.ApiResponse;
import com.electoral.testigos.model.Testigo;
import com.electoral.testigos.service.TestigoService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/testigos")
public class TestigoController {

    @Autowired
    private TestigoService testigoService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<?> registrarTestigo(@Valid @RequestBody TestigoRequest request) {
        try {
            Testigo testigo = testigoService.registrarTestigo(request);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(new ApiResponse<>(true, "Testigo registrado correctamente", testigo));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ApiResponse<>(false, e.getMessage(), null));
        }
    }
}
