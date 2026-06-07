package com.electoral.testigos.service;

import com.electoral.testigos.dto.request.LoginRequest;
import com.electoral.testigos.dto.response.JwtResponse;
import com.electoral.testigos.model.enums.AccionAuditoria;
import com.electoral.testigos.security.CustomUserDetails;
import com.electoral.testigos.security.JwtTokenProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class AuthService {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private AuditService auditService;

    public JwtResponse authenticateUser(LoginRequest loginRequest) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequest.getCorreo(), loginRequest.getPassword()));

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = jwtTokenProvider.generateJwtToken(authentication);

        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        List<String> roles = userDetails.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toList());

        String rol = roles.isEmpty() ? "" : roles.get(0).replace("ROLE_", "");

        auditService.log(AccionAuditoria.LOGIN, "Usuario inició sesión exitosamente", "Usuario", userDetails.getId());

        return new JwtResponse(jwt, userDetails.getId(), userDetails.getNombre(), userDetails.getUsername(), rol);
    }
}
