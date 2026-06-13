package com.electoral.testigos.service;

import com.electoral.testigos.dto.response.distribucion.*;
import com.electoral.testigos.model.Mesa;
import com.electoral.testigos.model.Testigo;
import com.electoral.testigos.model.Puesto;
import com.electoral.testigos.repository.MesaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class DistribucionService {

    @Autowired
    private MesaRepository mesaRepository;

    @Transactional(readOnly = true)
    public DistribucionMunicipioResponse getDistribucion(Long municipioId) {
        // Obtenemos todas las mesas con sus relaciones eager
        List<Mesa> todasLasMesas = mesaRepository.findAllWithEagerRelationships();
        
        List<Mesa> mesasDelMunicipio = todasLasMesas.stream()
            .filter(m -> m.getPuesto() != null && m.getPuesto().getMunicipio() != null &&
                         m.getPuesto().getMunicipio().getId().equals(municipioId))
            .collect(Collectors.toList());

        List<TestigoMovibleDTO> testigosMovibles = new ArrayList<>();
        Map<Puesto, List<MesaNecesitadaDTO>> mapPuestosNecesitados = new HashMap<>();

        for (Mesa mesa : mesasDelMunicipio) {
            Puesto puesto = mesa.getPuesto();
            int realOcupados = mesa.getOcupados();

            // Si hay sobrecupo o testigos movibles (>= 2 ocupados)
            if (realOcupados >= 2 && mesa.getTestigos() != null) {
                // Ordenamos los testigos por ID (para dejar fijo al primero que se registró)
                List<Testigo> testigosMesa = new ArrayList<>(mesa.getTestigos());
                testigosMesa.sort(Comparator.comparing(Testigo::getId));
                
                // Agregamos todos MENOS el primero a la lista de movibles
                for (int i = 1; i < testigosMesa.size(); i++) {
                    Testigo t = testigosMesa.get(i);
                    testigosMovibles.add(TestigoMovibleDTO.builder()
                            .id(t.getId())
                            .nombreCompleto(t.getNombreCompleto())
                            .documento(t.getDocumento())
                            .mesaOrigenId(mesa.getId())
                            .numeroMesaOrigen(mesa.getNumeroMesa())
                            .puestoOrigenId(puesto.getId())
                            .nombrePuestoOrigen(puesto.getNombrePuesto())
                            .build());
                }
            }

            // Si la mesa está necesitada (< 2)
            if (realOcupados < mesa.getCapacidad()) {
                MesaNecesitadaDTO mesaNecesitada = MesaNecesitadaDTO.builder()
                        .mesaId(mesa.getId())
                        .numeroMesa(mesa.getNumeroMesa())
                        .ocupados(realOcupados)
                        .capacidad(mesa.getCapacidad())
                        .faltantes(mesa.getCapacidad() - realOcupados)
                        .build();

                mapPuestosNecesitados.computeIfAbsent(puesto, k -> new ArrayList<>()).add(mesaNecesitada);
            }
        }

        // Ordenamos las mesas de cada puesto por número
        for (List<MesaNecesitadaDTO> mesas : mapPuestosNecesitados.values()) {
            mesas.sort(Comparator.comparing(MesaNecesitadaDTO::getNumeroMesa));
        }

        List<PuestoNecesitadoDTO> puestosNecesitados = mapPuestosNecesitados.entrySet().stream()
                .map(entry -> PuestoNecesitadoDTO.builder()
                        .puestoId(entry.getKey().getId())
                        .nombrePuesto(entry.getKey().getNombrePuesto())
                        .zona(entry.getKey().getZona())
                        .mesas(entry.getValue())
                        .build())
                .sorted(Comparator.comparing(PuestoNecesitadoDTO::getNombrePuesto))
                .collect(Collectors.toList());

        return DistribucionMunicipioResponse.builder()
                .testigosMovibles(testigosMovibles)
                .puestosNecesitados(puestosNecesitados)
                .build();
    }
}
