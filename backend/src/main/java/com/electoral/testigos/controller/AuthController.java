package com.electoral.testigos.controller;

import com.electoral.testigos.dto.request.LoginRequest;
import com.electoral.testigos.dto.response.ApiResponse;
import com.electoral.testigos.dto.response.JwtResponse;
import com.electoral.testigos.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {
        JwtResponse jwtResponse = authService.authenticateUser(loginRequest);
        return ResponseEntity.ok(new ApiResponse<>(true, "Login exitoso", jwtResponse));
    }
}
