package com.electoral.testigos.service;

import com.electoral.testigos.dto.response.DashboardStats;
import com.electoral.testigos.repository.DepartamentoRepository;
import com.electoral.testigos.repository.MesaRepository;
import com.electoral.testigos.repository.MunicipioRepository;
import com.electoral.testigos.repository.PuestoRepository;
import com.electoral.testigos.repository.TestigoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class DashboardService {

    @Autowired
    private TestigoRepository testigoRepository;

    @Autowired
    private MunicipioRepository municipioRepository;

    @Autowired
    private PuestoRepository puestoRepository;

    @Autowired
    private MesaRepository mesaRepository;

    public DashboardStats getGeneralStats() {
        long totalTestigos = testigoRepository.count();
        long totalMunicipios = municipioRepository.count();
        long totalPuestos = puestoRepository.count();
        long totalMesas = mesaRepository.count();
        
        long mesasVerdes = mesaRepository.countMesasVerdes();
        long mesasAmarillas = mesaRepository.countMesasAmarillas();
        long mesasRojas = mesaRepository.countMesasRojas();
        
        long mesasCubiertas = mesasVerdes + mesasAmarillas; // Al menos 1 testigo
        long mesasPendientes = mesasRojas; // 0 testigos
        
        double porcentajeCobertura = totalMesas > 0 ? ((double) mesasCubiertas / totalMesas) * 100 : 0.0;

        return DashboardStats.builder()
                .totalTestigos(totalTestigos)
                .totalMunicipios(totalMunicipios)
                .totalPuestos(totalPuestos)
                .totalMesas(totalMesas)
                .mesasVerdes(mesasVerdes)
                .mesasAmarillas(mesasAmarillas)
                .mesasRojas(mesasRojas)
                .mesasCubiertas(mesasCubiertas)
                .mesasPendientes(mesasPendientes)
                .porcentajeCobertura(Math.round(porcentajeCobertura * 100.0) / 100.0)
                .build();
    }
}
