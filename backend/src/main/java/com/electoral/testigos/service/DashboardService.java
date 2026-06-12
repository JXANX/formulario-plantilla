package com.electoral.testigos.service;

import com.electoral.testigos.dto.response.DashboardStats;
import com.electoral.testigos.dto.response.CoberturaMunicipioResponse;
import com.electoral.testigos.dto.response.CoberturaPuestoResponse;
import com.electoral.testigos.model.Mesa;
import com.electoral.testigos.model.Municipio;
import com.electoral.testigos.model.Puesto;
import com.electoral.testigos.repository.DepartamentoRepository;
import com.electoral.testigos.repository.MesaRepository;
import com.electoral.testigos.repository.MunicipioRepository;
import com.electoral.testigos.repository.PuestoRepository;
import com.electoral.testigos.repository.TestigoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.ArrayList;
import java.util.stream.Collectors;

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

        long testigosFaltantes = Math.max(0, totalMesas - totalTestigos);
        long mesasFaltantesCompletas = mesasAmarillas + mesasRojas; // faltan por tener los 2 testigos
        long mesasSinNingunTestigo = Math.max(0, totalMesas - totalTestigos); // El usuario quiere esto como la diferencia directa

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
                .testigosFaltantes(testigosFaltantes)
                .mesasFaltantesCompletas(mesasFaltantesCompletas)
                .mesasSinNingunTestigo(mesasSinNingunTestigo)
                .porcentajeCobertura(Math.round(porcentajeCobertura * 100.0) / 100.0)
                .build();
    }

    public List<CoberturaMunicipioResponse> getCoberturaMunicipios(Long departamentoId) {
        List<Mesa> mesas = mesaRepository.findAllWithEagerRelationships();
        
        if (departamentoId != null) {
            mesas = mesas.stream()
                .filter(m -> m.getPuesto() != null && 
                            m.getPuesto().getMunicipio() != null && 
                            m.getPuesto().getMunicipio().getDepartamento() != null && 
                            m.getPuesto().getMunicipio().getDepartamento().getId().equals(departamentoId))
                .collect(Collectors.toList());
        }
        
        java.util.Map<Municipio, List<Mesa>> mesasByMunicipio = mesas.stream()
            .filter(m -> m.getPuesto() != null && m.getPuesto().getMunicipio() != null)
            .collect(Collectors.groupingBy(m -> m.getPuesto().getMunicipio()));
            
        List<CoberturaMunicipioResponse> responses = new ArrayList<>();
        for (java.util.Map.Entry<Municipio, List<Mesa>> entry : mesasByMunicipio.entrySet()) {
            Municipio municipio = entry.getKey();
            List<Mesa> municipioMesas = entry.getValue();
            
            long totalMesas = municipioMesas.size();
            long mesasConTestigo = municipioMesas.stream().filter(m -> m.getOcupados() > 0).count();
            long mesasSinTestigo = totalMesas - mesasConTestigo;
            double porcentaje = totalMesas > 0 ? ((double) mesasConTestigo / totalMesas) * 100.0 : 0.0;
            porcentaje = Math.round(porcentaje * 100.0) / 100.0;
            
            responses.add(CoberturaMunicipioResponse.builder()
                .municipioId(municipio.getId())
                .municipioNombre(municipio.getNombre())
                .codigoMunicipio(municipio.getCodigoMunicipio())
                .departamentoId(municipio.getDepartamento() != null ? municipio.getDepartamento().getId() : null)
                .departamentoNombre(municipio.getDepartamento() != null ? municipio.getDepartamento().getNombre() : "")
                .totalMesas(totalMesas)
                .mesasConTestigo(mesasConTestigo)
                .mesasSinTestigo(mesasSinTestigo)
                .porcentajeCobertura(porcentaje)
                .build());
        }
        
        // Ordenar de menor a mayor cobertura
        responses.sort((r1, r2) -> {
            int comp = Double.compare(r1.getPorcentajeCobertura(), r2.getPorcentajeCobertura());
            if (comp != 0) return comp;
            return r1.getMunicipioNombre().compareTo(r2.getMunicipioNombre());
        });
        
        return responses;
    }

    public List<CoberturaPuestoResponse> getCoberturaPuestos(Long municipioId) {
        List<Mesa> mesas = mesaRepository.findAllWithEagerRelationships();
        
        if (municipioId != null) {
            mesas = mesas.stream()
                .filter(m -> m.getPuesto() != null && 
                             m.getPuesto().getMunicipio() != null && 
                             m.getPuesto().getMunicipio().getId().equals(municipioId))
                .collect(Collectors.toList());
        }
        
        java.util.Map<Puesto, List<Mesa>> mesasByPuesto = mesas.stream()
            .filter(m -> m.getPuesto() != null)
            .collect(Collectors.groupingBy(Mesa::getPuesto));
            
        List<CoberturaPuestoResponse> responses = new ArrayList<>();
        for (java.util.Map.Entry<Puesto, List<Mesa>> entry : mesasByPuesto.entrySet()) {
            Puesto puesto = entry.getKey();
            List<Mesa> puestoMesas = entry.getValue();
            
            long totalMesas = puestoMesas.size();
            long mesasTotalmenteCubiertas = puestoMesas.stream().filter(m -> m.getOcupados() >= 2).count();
            long mesasParcialmenteCubiertas = puestoMesas.stream().filter(m -> m.getOcupados() == 1).count();
            long mesasSinTestigo = puestoMesas.stream().filter(m -> m.getOcupados() == 0).count();
            
            long mesasConTestigo = mesasTotalmenteCubiertas + mesasParcialmenteCubiertas;
            double porcentaje = totalMesas > 0 ? ((double) mesasConTestigo / totalMesas) * 100.0 : 0.0;
            porcentaje = Math.round(porcentaje * 100.0) / 100.0;
            
            responses.add(CoberturaPuestoResponse.builder()
                .puestoId(puesto.getId())
                .puestoNombre(puesto.getNombrePuesto())
                .zona(puesto.getZona())
                .municipioId(puesto.getMunicipio() != null ? puesto.getMunicipio().getId() : null)
                .municipioNombre(puesto.getMunicipio() != null ? puesto.getMunicipio().getNombre() : "")
                .totalMesas(totalMesas)
                .mesasTotalmenteCubiertas(mesasTotalmenteCubiertas)
                .mesasParcialmenteCubiertas(mesasParcialmenteCubiertas)
                .mesasSinTestigo(mesasSinTestigo)
                .porcentajeCobertura(porcentaje)
                .build());
        }
        
        // Ordenar de menor a mayor cobertura
        responses.sort((r1, r2) -> {
            int comp = Double.compare(r1.getPorcentajeCobertura(), r2.getPorcentajeCobertura());
            if (comp != 0) return comp;
            return r1.getPuestoNombre().compareTo(r2.getPuestoNombre());
        });
        
        return responses;
    }
}
