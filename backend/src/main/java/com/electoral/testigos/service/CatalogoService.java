package com.electoral.testigos.service;

import com.electoral.testigos.model.Departamento;
import com.electoral.testigos.model.Mesa;
import com.electoral.testigos.model.Municipio;
import com.electoral.testigos.model.Puesto;
import com.electoral.testigos.model.Testigo;
import com.electoral.testigos.repository.DepartamentoRepository;
import com.electoral.testigos.repository.MesaRepository;
import com.electoral.testigos.repository.MunicipioRepository;
import com.electoral.testigos.repository.PuestoRepository;
import com.electoral.testigos.repository.TestigoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class CatalogoService {

    @Autowired
    private DepartamentoRepository departamentoRepository;

    @Autowired
    private MunicipioRepository municipioRepository;

    @Autowired
    private PuestoRepository puestoRepository;

    @Autowired
    private MesaRepository mesaRepository;

    @Autowired
    private TestigoRepository testigoRepository;

    public List<Departamento> getAllDepartamentos() {
        return departamentoRepository.findAll();
    }

    public List<Municipio> getMunicipiosByDepartamento(Long departamentoId) {
        return municipioRepository.findByDepartamentoId(departamentoId);
    }

    public List<Puesto> getPuestosByMunicipio(Long municipioId) {
        return puestoRepository.findByMunicipioId(municipioId);
    }

    public List<Mesa> getMesasByPuesto(Long puestoId) {
        return mesaRepository.findByPuestoId(puestoId);
    }

    @Transactional
    public Puesto asignarCoordinador(Long puestoId, Long testigoId) {
        Puesto puesto = puestoRepository.findById(puestoId)
                .orElseThrow(() -> new IllegalArgumentException("Puesto no encontrado con ID: " + puestoId));
        
        if (testigoId == null) {
            puesto.setCoordinador(null);
        } else {
            Testigo testigo = testigoRepository.findById(testigoId)
                    .orElseThrow(() -> new IllegalArgumentException("Testigo no encontrado con ID: " + testigoId));
            puesto.setCoordinador(testigo);
        }
        
        return puestoRepository.save(puesto);
    }

    public List<Testigo> getTestigosPorPuesto(Long puestoId) {
        return testigoRepository.findByPuestoId(puestoId);
    }
}
