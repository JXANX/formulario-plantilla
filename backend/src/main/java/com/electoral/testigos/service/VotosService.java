package com.electoral.testigos.service;

import com.electoral.testigos.model.*;
import com.electoral.testigos.model.enums.OrigenFoto;
import com.electoral.testigos.repository.*;
import com.electoral.testigos.dto.response.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.util.stream.Collectors;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class VotosService {

    @Autowired
    private MesaRepository mesaRepository;

    @Autowired
    private CandidatoRepository candidatoRepository;

    @Autowired
    private TipoVotoRepository tipoVotoRepository;

    @Autowired
    private RegistroVotoRegistraduriaRepository registraduriaRepository;

    @Autowired
    private RegistroVotoTestigoRepository testigoVotoRepository;

    @Autowired
    private DiscrepanciaRepository discrepanciaRepository;

    @Autowired
    private FotoE14Repository fotoRepository;

    @Autowired
    private TestigoRepository testigoRepository;

    private final String UPLOAD_DIR = "./uploads/E14";

    @Transactional
    public void registrarVotosRegistraduria(Long mesaId, Long candidatoId, Long tipoVotoId, Integer votos) {
        Mesa mesa = mesaRepository.findById(mesaId)
                .orElseThrow(() -> new RuntimeException("Mesa no encontrada"));
        TipoVoto tipoVoto = tipoVotoRepository.findById(tipoVotoId)
                .orElseThrow(() -> new RuntimeException("Tipo de voto no encontrado"));
        Candidato candidato = candidatoId != null ? candidatoRepository.findById(candidatoId).orElse(null) : null;

        Optional<RegistroVotoRegistraduria> optReg = candidato != null
                ? registraduriaRepository.findByMesaIdAndCandidatoIdAndTipoVotoId(mesaId, candidatoId, tipoVotoId)
                : registraduriaRepository.findByMesaIdAndCandidatoIsNullAndTipoVotoId(mesaId, tipoVotoId);

        RegistroVotoRegistraduria reg;
        if (optReg.isPresent()) {
            reg = optReg.get();
            reg.setVotos(votos);
        } else {
            reg = RegistroVotoRegistraduria.builder()
                    .mesa(mesa)
                    .candidato(candidato)
                    .tipoVoto(tipoVoto)
                    .votos(votos)
                    .build();
        }
        registraduriaRepository.save(reg);
        recalcularDiscrepancia(mesaId, candidatoId, tipoVotoId);
    }

    @Transactional
    public void registrarVotosTestigo(Long mesaId, Long candidatoId, Long tipoVotoId, Integer votos, Long testigoId) {
        Mesa mesa = mesaRepository.findById(mesaId)
                .orElseThrow(() -> new RuntimeException("Mesa no encontrada"));
        TipoVoto tipoVoto = tipoVotoRepository.findById(tipoVotoId)
                .orElseThrow(() -> new RuntimeException("Tipo de voto no encontrado"));
        Candidato candidato = candidatoId != null ? candidatoRepository.findById(candidatoId).orElse(null) : null;
        Testigo testigo = testigoId != null ? testigoRepository.findById(testigoId).orElse(null) : null;

        Optional<RegistroVotoTestigo> optReg = candidato != null
                ? testigoVotoRepository.findByMesaIdAndCandidatoIdAndTipoVotoId(mesaId, candidatoId, tipoVotoId)
                : testigoVotoRepository.findByMesaIdAndCandidatoIsNullAndTipoVotoId(mesaId, tipoVotoId);

        RegistroVotoTestigo reg;
        if (optReg.isPresent()) {
            reg = optReg.get();
            reg.setVotos(votos);
            if (testigo != null) reg.setTestigo(testigo);
        } else {
            reg = RegistroVotoTestigo.builder()
                    .mesa(mesa)
                    .candidato(candidato)
                    .tipoVoto(tipoVoto)
                    .votos(votos)
                    .testigo(testigo)
                    .build();
        }
        testigoVotoRepository.save(reg);
        recalcularDiscrepancia(mesaId, candidatoId, tipoVotoId);
    }

    @Transactional
    public void recalcularDiscrepancia(Long mesaId, Long candidatoId, Long tipoVotoId) {
        Mesa mesa = mesaRepository.findById(mesaId)
                .orElseThrow(() -> new RuntimeException("Mesa no encontrada"));
        TipoVoto tipoVoto = tipoVotoRepository.findById(tipoVotoId)
                .orElseThrow(() -> new RuntimeException("Tipo de voto no encontrado"));
        Candidato candidato = candidatoId != null ? candidatoRepository.findById(candidatoId).orElse(null) : null;

        Optional<RegistroVotoRegistraduria> optReg = candidato != null
                ? registraduriaRepository.findByMesaIdAndCandidatoIdAndTipoVotoId(mesaId, candidatoId, tipoVotoId)
                : registraduriaRepository.findByMesaIdAndCandidatoIsNullAndTipoVotoId(mesaId, tipoVotoId);

        Optional<RegistroVotoTestigo> optTest = candidato != null
                ? testigoVotoRepository.findByMesaIdAndCandidatoIdAndTipoVotoId(mesaId, candidatoId, tipoVotoId)
                : testigoVotoRepository.findByMesaIdAndCandidatoIsNullAndTipoVotoId(mesaId, tipoVotoId);

        int votosReg = optReg.map(RegistroVotoRegistraduria::getVotos).orElse(0);
        int votosTest = optTest.map(RegistroVotoTestigo::getVotos).orElse(0);

        Optional<Discrepancia> optDisc = candidato != null
                ? discrepanciaRepository.findByMesaIdAndCandidatoIdAndTipoVotoId(mesaId, candidatoId, tipoVotoId)
                : discrepanciaRepository.findByMesaIdAndCandidatoIsNullAndTipoVotoId(mesaId, tipoVotoId);

        Discrepancia disc;
        if (optDisc.isPresent()) {
            disc = optDisc.get();
            disc.setVotosRegistraduria(votosReg);
            disc.setVotosTestigo(votosTest);
            disc.setDiferencia(votosReg - votosTest);
            disc.setResuelta(votosReg == votosTest);
        } else {
            disc = Discrepancia.builder()
                    .mesa(mesa)
                    .candidato(candidato)
                    .tipoVoto(tipoVoto)
                    .votosRegistraduria(votosReg)
                    .votosTestigo(votosTest)
                    .diferencia(votosReg - votosTest)
                    .resuelta(votosReg == votosTest)
                    .build();
        }
        discrepanciaRepository.save(disc);
    }

    @Transactional
    public FotoE14 guardarFotoE14(Long mesaId, String origenStr, MultipartFile file, Usuario usuario) throws IOException {
        Mesa mesa = mesaRepository.findById(mesaId)
                .orElseThrow(() -> new RuntimeException("Mesa no encontrada"));
        Puesto puesto = mesa.getPuesto();
        Municipio municipio = puesto.getMunicipio();

        OrigenFoto origen = OrigenFoto.valueOf(origenStr.toUpperCase());

        // Create folder: uploads/E14/{municipio_id}/{puesto_id}/{mesa_id}/
        String folderPath = String.format("%s/%d/%d/%d", UPLOAD_DIR, municipio.getId(), puesto.getId(), mesa.getId());
        File dir = new File(folderPath);
        if (!dir.exists()) {
            dir.mkdirs();
        }

        String originalFilename = file.getOriginalFilename();
        String extension = originalFilename != null && originalFilename.contains(".")
                ? originalFilename.substring(originalFilename.lastIndexOf("."))
                : ".jpg";

        String filename = String.format("%s_%d%s", origen.name(), System.currentTimeMillis(), extension);
        Path targetPath = Paths.get(folderPath, filename);
        Files.write(targetPath, file.getBytes());

        // Delete previous if same origin exists (to replace)
        Optional<FotoE14> optPrev = fotoRepository.findByMesaIdAndOrigen(mesaId, origen);
        if (optPrev.isPresent()) {
            FotoE14 prev = optPrev.get();
            File prevFile = new File(prev.getRutaArchivo());
            if (prevFile.exists()) {
                prevFile.delete();
            }
            fotoRepository.delete(prev);
        }

        FotoE14 foto = FotoE14.builder()
                .mesa(mesa)
                .origen(origen)
                .rutaArchivo(targetPath.toString())
                .fechaSubida(LocalDateTime.now())
                .subidoPor(usuario)
                .build();

        return fotoRepository.save(foto);
    }

    @Transactional(readOnly = true)
    public File obtenerArchivoFoto(Long fotoId) {
        FotoE14 foto = fotoRepository.findById(fotoId)
                .orElseThrow(() -> new RuntimeException("Registro de foto no encontrado"));
        File file = new File(foto.getRutaArchivo());
        if (!file.exists()) {
            throw new RuntimeException("Archivo físico de imagen no encontrado");
        }
        return file;
    }

    @Transactional(readOnly = true)
    public List<FotoE14> obtenerFotosPorMesa(Long mesaId) {
        return fotoRepository.findByMesaId(mesaId);
    }

    @Transactional(readOnly = true)
    public List<Discrepancia> obtenerDiscrepanciasActivas() {
        return discrepanciaRepository.findAllWithDiscrepancy();
    }

    @Transactional(readOnly = true)
    public VotosDetalleMesaResponse obtenerDetalleMesa(Long mesaId) {
        Mesa mesa = mesaRepository.findById(mesaId).orElseThrow(() -> new RuntimeException("Mesa no encontrada"));
        Puesto puesto = mesa.getPuesto();
        Municipio municipio = puesto.getMunicipio();

        // Buscar testigo asignado
        Optional<Testigo> testigoOpt = mesa.getTestigos().stream().findFirst();

        List<Candidato> candidatos = candidatoRepository.findAll();
        List<TipoVoto> tiposVoto = tipoVotoRepository.findAll();

        List<RegistroVotoRegistraduria> regsReg = registraduriaRepository.findByMesaId(mesaId);
        List<RegistroVotoTestigo> regsTest = testigoVotoRepository.findByMesaId(mesaId);
        List<Discrepancia> discreps = discrepanciaRepository.findByMesaId(mesaId);

        List<VotosDetalleMesaResponse.VotoRenglon> renglones = new ArrayList<>();

        for (TipoVoto tv : tiposVoto) {
            if (tv.getCodigo().equalsIgnoreCase("CANDIDATO")) {
                for (Candidato c : candidatos) {
                    if (!c.getActivo()) continue;
                    
                    int votosReg = regsReg.stream().filter(r -> r.getCandidato() != null && r.getCandidato().getId().equals(c.getId()) && r.getTipoVoto().getId().equals(tv.getId())).map(RegistroVotoRegistraduria::getVotos).findFirst().orElse(0);
                    int votosTest = regsTest.stream().filter(r -> r.getCandidato() != null && r.getCandidato().getId().equals(c.getId()) && r.getTipoVoto().getId().equals(tv.getId())).map(RegistroVotoTestigo::getVotos).findFirst().orElse(0);
                    int dif = discreps.stream().filter(d -> d.getCandidato() != null && d.getCandidato().getId().equals(c.getId()) && d.getTipoVoto().getId().equals(tv.getId())).map(Discrepancia::getDiferencia).findFirst().orElse(votosReg - votosTest);

                    renglones.add(VotosDetalleMesaResponse.VotoRenglon.builder()
                            .candidatoId(c.getId())
                            .candidatoNombre(c.getNombre())
                            .candidatoPartido(c.getPartido())
                            .candidatoNumeroTarjeton(c.getNumeroTarjeton())
                            .tipoVotoId(tv.getId())
                            .tipoVotoCodigo(tv.getCodigo())
                            .tipoVotoNombre(tv.getNombre())
                            .votosRegistraduria(votosReg)
                            .votosTestigo(votosTest)
                            .diferencia(dif)
                            .build());
                }
            } else {
                int votosReg = regsReg.stream().filter(r -> r.getCandidato() == null && r.getTipoVoto().getId().equals(tv.getId())).map(RegistroVotoRegistraduria::getVotos).findFirst().orElse(0);
                int votosTest = regsTest.stream().filter(r -> r.getCandidato() == null && r.getTipoVoto().getId().equals(tv.getId())).map(RegistroVotoTestigo::getVotos).findFirst().orElse(0);
                int dif = discreps.stream().filter(d -> d.getCandidato() == null && d.getTipoVoto().getId().equals(tv.getId())).map(Discrepancia::getDiferencia).findFirst().orElse(votosReg - votosTest);

                renglones.add(VotosDetalleMesaResponse.VotoRenglon.builder()
                        .candidatoId(null)
                        .candidatoNombre(null)
                        .candidatoPartido(null)
                        .candidatoNumeroTarjeton(null)
                        .tipoVotoId(tv.getId())
                        .tipoVotoCodigo(tv.getCodigo())
                        .tipoVotoNombre(tv.getNombre())
                        .votosRegistraduria(votosReg)
                        .votosTestigo(votosTest)
                        .diferencia(dif)
                        .build());
            }
        }

        List<FotoE14> fotosEntity = fotoRepository.findByMesaId(mesaId);
        List<VotosDetalleMesaResponse.FotoE14DTO> fotos = fotosEntity.stream()
                .map(f -> VotosDetalleMesaResponse.FotoE14DTO.builder()
                        .id(f.getId())
                        .origen(f.getOrigen().name())
                        .fechaSubida(f.getFechaSubida().toString())
                        .subidoPorNombre(f.getSubidoPor() != null ? f.getSubidoPor().getNombre() : "Sistema")
                        .build())
                .collect(java.util.stream.Collectors.toList());

        return VotosDetalleMesaResponse.builder()
                .mesaId(mesa.getId())
                .numeroMesa(mesa.getNumeroMesa())
                .puestoNombre(puesto.getNombrePuesto())
                .municipioNombre(municipio.getNombre())
                .testigoId(testigoOpt.map(Testigo::getId).orElse(null))
                .testigoNombre(testigoOpt.map(Testigo::getNombreCompleto).orElse(null))
                .testigoCelular(testigoOpt.map(Testigo::getCelular).orElse(null))
                .testigoDocumento(testigoOpt.map(Testigo::getDocumento).orElse(null))
                .renglones(renglones)
                .fotos(fotos)
                .build();
    }

    @Autowired
    private MunicipioRepository municipioRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private AsignacionOperarioRepository asignacionRepository;

    @Transactional(readOnly = true)
    public VotosResumenResponse obtenerResumenConteo() {
        long totalMesas = mesaRepository.countByNumeroMesaGreaterThan(0);
        
        // Count mesas with votes registered (we check if there are entries in the tables)
        // Spring Boot/JPA count query:
        // Here we can fetch counts using lists or custom JPQL. Since tables are small, custom count queries or simple mapping works perfectly.
        // Let's count tables with registraduria entries:
        // We can do it by querying all distinct mesa ids from Registraduría table
        long reportadasReg = registraduriaRepository.findAll().stream().map(r -> r.getMesa().getId()).distinct().count();
        long reportadasTest = testigoVotoRepository.findAll().stream().map(r -> r.getMesa().getId()).distinct().count();
        long totalVotosReg = registraduriaRepository.findAll().stream().mapToLong(com.electoral.testigos.model.RegistroVotoRegistraduria::getVotos).sum();
        long totalVotosTest = testigoVotoRepository.findAll().stream().mapToLong(com.electoral.testigos.model.RegistroVotoTestigo::getVotos).sum();
        
        List<Discrepancia> activeDiscrepancies = discrepanciaRepository.findAllWithDiscrepancy();
        long mesasConDisc = activeDiscrepancies.stream().map(d -> d.getMesa().getId()).distinct().count();
        long totalActiveDiscrepancies = activeDiscrepancies.size();

        // 1. Municipios resumen
        List<Municipio> munis = municipioRepository.findAll();
        List<VotosResumenResponse.ResumenMunicipio> resumenMunis = new ArrayList<>();
        
        for (Municipio m : munis) {
            long totalM = m.getPuestos().stream().flatMap(p -> p.getMesas().stream()).filter(me -> me.getNumeroMesa() > 0).count();
            if (totalM == 0) continue;

            long repReg = registraduriaRepository.findAll().stream()
                    .filter(r -> r.getMesa().getPuesto().getMunicipio().getId().equals(m.getId()))
                    .map(r -> r.getMesa().getId()).distinct().count();
            long repTest = testigoVotoRepository.findAll().stream()
                    .filter(r -> r.getMesa().getPuesto().getMunicipio().getId().equals(m.getId()))
                    .map(r -> r.getMesa().getId()).distinct().count();
            long conDisc = activeDiscrepancies.stream()
                    .filter(d -> d.getMesa().getPuesto().getMunicipio().getId().equals(m.getId()))
                    .map(d -> d.getMesa().getId()).distinct().count();

            resumenMunis.add(VotosResumenResponse.ResumenMunicipio.builder()
                    .municipioId(m.getId())
                    .municipioNombre(m.getNombre())
                    .totalMesas(totalM)
                    .reportadasRegistraduria(repReg)
                    .reportadasTestigo(repTest)
                    .conDiscrepancias(conDisc)
                    .porcentajeAvance(totalM > 0 ? ((double) repReg / totalM) * 100.0 : 0.0)
                    .build());
        }

        // 2. Operarios resumen
        List<Usuario> operarios = usuarioRepository.findAll().stream()
                .filter(u -> u.getRol() == com.electoral.testigos.model.enums.Rol.OPERARIO)
                .collect(Collectors.toList());
        List<VotosResumenResponse.ResumenOperario> resumenOperarios = new ArrayList<>();

        for (Usuario op : operarios) {
            List<AsignacionOperario> asigs = asignacionRepository.findByOperarioId(op.getId());
            long assigned = asigs.stream().filter(a -> a.getMesa() != null).count();
            if (assigned == 0) continue;

            List<Long> assignedMesaIds = asigs.stream().filter(a -> a.getMesa() != null).map(a -> a.getMesa().getId()).collect(Collectors.toList());

            long repReg = registraduriaRepository.findAll().stream()
                    .filter(r -> assignedMesaIds.contains(r.getMesa().getId()))
                    .map(r -> r.getMesa().getId()).distinct().count();
            long repTest = testigoVotoRepository.findAll().stream()
                    .filter(r -> assignedMesaIds.contains(r.getMesa().getId()))
                    .map(r -> r.getMesa().getId()).distinct().count();
            long conDisc = activeDiscrepancies.stream()
                    .filter(d -> assignedMesaIds.contains(d.getMesa().getId()))
                    .map(d -> d.getMesa().getId()).distinct().count();

            resumenOperarios.add(VotosResumenResponse.ResumenOperario.builder()
                    .operarioId(op.getId())
                    .operarioNombre(op.getNombre())
                    .mesasAsignadas(assigned)
                    .reportadasRegistraduria(repReg)
                    .reportadasTestigo(repTest)
                    .conDiscrepancias(conDisc)
                    .build());
        }

        return VotosResumenResponse.builder()
                .totalMesas(totalMesas)
                .mesasReportadasRegistraduria(reportadasReg)
                .mesasReportadasTestigo(reportadasTest)
                .mesasConDiscrepancias(mesasConDisc)
                .totalDiscrepanciasActivas(totalActiveDiscrepancies)
                .totalVotosRegistraduria(totalVotosReg)
                .totalVotosTestigo(totalVotosTest)
                .municipios(resumenMunis)
                .operarios(resumenOperarios)
                .build();
    }
}
