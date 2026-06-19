package com.electoral.testigos.service;

import com.electoral.testigos.dto.response.AcreditadoDashboardStats;
import com.electoral.testigos.dto.response.AcreditadoResponse;
import com.electoral.testigos.dto.response.CoberturaMunicipioResponse;
import com.electoral.testigos.dto.response.CoberturaPuestoResponse;
import com.electoral.testigos.dto.response.ComparativaTestigoResponse;
import com.electoral.testigos.model.*;
import com.electoral.testigos.model.enums.AccionAuditoria;
import com.electoral.testigos.repository.*;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AcreditadoService {

    private static final Logger logger = LoggerFactory.getLogger(AcreditadoService.class);

    @Autowired
    private DepartamentoRepository departamentoRepository;

    @Autowired
    private MunicipioRepository municipioRepository;

    @Autowired
    private PuestoRepository puestoRepository;

    @Autowired
    private MesaRepository mesaRepository;

    @Autowired
    private AcreditadoRepository acreditadoRepository;

    @Autowired
    private TestigoRepository testigoRepository;

    @Autowired
    private AuditService auditService;

    @Autowired
    private WebSocketNotificationService wsNotificationService;

    // Headers para exportar acreditados detallado
    private static final String[] HEADERS_DETALLADO = {
        "COD DEPARTAMENTO", "COD MUNICIPIO", "ZONA", "COD PUESTO",
        "NOM DEPARTAMENTO", "NOM MUNICIPIO", "NOM PUESTO", "MESA",
        "ORGANIZACIÓN", "IDENTIFICACIÓN", "NOMBRE COMPLETO", "CELULAR", "CORREO", "TIPO TESTIGO", "ESTADO"
    };

    private static final String[] HEADERS_COBERTURA = {
        "DEPARTAMENTO", "MUNICIPIO", "TOTAL MESAS", "MESAS CUBIERTAS", "MESAS SIN COBERTURA", "PORCENTAJE COBERTURA"
    };

    @Transactional
    public void importarAcreditados(InputStream is) throws Exception {
        logger.info("Iniciando importación de acreditados...");

        try (Workbook workbook = WorkbookFactory.create(is)) {
            Sheet sheet = workbook.getSheetAt(0);
            int lastRowNum = sheet.getLastRowNum();

            wsNotificationService.notificarProgresoImportacion(0, lastRowNum);

            for (int i = 1; i <= lastRowNum; i++) {
                try {
                    if (i % 10 == 0 || i == lastRowNum) {
                        wsNotificationService.notificarProgresoImportacion(i, lastRowNum);
                    }
                    Row row = sheet.getRow(i);
                    if (row == null) continue;

                    // Skip empty rows
                    boolean isRowEmpty = true;
                    for (int c = 0; c < 15; c++) {
                        if (!getCellValueAsString(row.getCell(c)).isEmpty()) {
                            isRowEmpty = false;
                            break;
                        }
                    }
                    if (isRowEmpty) continue;

                    // Read columns by exact columns indices
                    String codDepto = getCellValueAsString(row.getCell(0));
                    String codMpio = getCellValueAsString(row.getCell(1));
                    String zona = getCellValueAsString(row.getCell(2));
                    String codPuesto = getCellValueAsString(row.getCell(3));
                    String mesaStr = getCellValueAsString(row.getCell(4));
                    String nomDepto = getCellValueAsString(row.getCell(5));
                    String nomMpio = getCellValueAsString(row.getCell(6));
                    String nomPuesto = getCellValueAsString(row.getCell(7));
                    String nomOrg = getCellValueAsString(row.getCell(8));
                    String documento = getCellValueAsString(row.getCell(9));
                    String nombreCompleto = getCellValueAsString(row.getCell(10));
                    String correo = getCellValueAsString(row.getCell(11));
                    String celular = getCellValueAsString(row.getCell(12));
                    String tipoTestigoStr = getCellValueAsString(row.getCell(13));
                    String estadoTestigoStr = getCellValueAsString(row.getCell(14));

                    if (documento.isEmpty()) continue;

                    // Build hierarchy if codes are present
                    Departamento departamento = null;
                    Municipio municipio = null;
                    Puesto puesto = null;
                    Mesa mesa = null;

                    if (!codDepto.isEmpty()) {
                        final String fCodDepto = codDepto;
                        final String fNomDepto = nomDepto;
                        departamento = departamentoRepository.findByCodigoDepartamento(fCodDepto)
                                .orElseGet(() -> departamentoRepository.save(Departamento.builder()
                                        .codigoDepartamento(fCodDepto)
                                        .nombre(fNomDepto)
                                        .build()));
                    }

                    if (!codMpio.isEmpty() && departamento != null) {
                        final String fCodMpio = codMpio;
                        final String fNomMpio = nomMpio;
                        final Departamento fDepto = departamento;
                        municipio = municipioRepository.findByCodigoMunicipio(fCodMpio)
                                .orElseGet(() -> municipioRepository.save(Municipio.builder()
                                        .codigoMunicipio(fCodMpio)
                                        .nombre(fNomMpio)
                                        .departamento(fDepto)
                                        .build()));
                    }

                    if (!codPuesto.isEmpty() && municipio != null) {
                        final String fCodPuesto = codPuesto;
                        final String fNomPuesto = nomPuesto;
                        final String fZona = zona.isEmpty() ? "01" : zona;
                        final Municipio fMpio = municipio;
                        puesto = puestoRepository.findByCodigoPuestoAndMunicipioIdAndZona(fCodPuesto, fMpio.getId(), fZona)
                                .orElseGet(() -> puestoRepository.save(Puesto.builder()
                                        .codigoPuesto(fCodPuesto)
                                        .nombrePuesto(fNomPuesto)
                                        .zona(fZona)
                                        .municipio(fMpio)
                                        .build()));
                    }

                    if (!mesaStr.isEmpty() && puesto != null) {
                        int numMesa = 0;
                        try {
                            String digits = mesaStr.replaceAll("[^0-9]", "");
                            if (!digits.isEmpty()) {
                                numMesa = Integer.parseInt(digits);
                            }
                        } catch (NumberFormatException e) {
                            logger.warn("Fila {}: Formato de mesa inválido: {}", i, mesaStr);
                        }
                        final int finalNumMesa = numMesa;
                        final Puesto fPuesto = puesto;
                        mesa = mesaRepository.findByPuestoIdAndNumeroMesa(fPuesto.getId(), finalNumMesa)
                                .orElseGet(() -> mesaRepository.save(Mesa.builder()
                                        .puesto(fPuesto)
                                        .numeroMesa(finalNumMesa)
                                        .capacidad(2)
                                        .ocupados(0)
                                        .build()));
                    }

                    if (mesa != null) {
                        Optional<Acreditado> existingOpt = acreditadoRepository.findByDocumento(documento);
                        if (existingOpt.isPresent()) {
                            Acreditado existing = existingOpt.get();
                            if (!nombreCompleto.isEmpty()) existing.setNombreCompleto(nombreCompleto.toUpperCase());
                            if (!celular.isEmpty()) existing.setCelular(celular);
                            if (!correo.isEmpty()) existing.setCorreo(correo);
                            if (!nomOrg.isEmpty()) existing.setNombreOrganizacion(nomOrg);
                            if (!tipoTestigoStr.isEmpty()) existing.setTipoTestigo(tipoTestigoStr.toUpperCase());
                            if (!estadoTestigoStr.isEmpty()) existing.setEstado(estadoTestigoStr);
                            existing.setMesa(mesa);
                            acreditadoRepository.save(existing);
                        } else {
                            Acreditado nuevo = Acreditado.builder()
                                    .documento(documento)
                                    .nombreCompleto(nombreCompleto.toUpperCase())
                                    .celular(celular)
                                    .correo(correo)
                                    .nombreOrganizacion(nomOrg)
                                    .tipoTestigo(tipoTestigoStr.toUpperCase())
                                    .estado(estadoTestigoStr)
                                    .mesa(mesa)
                                    .fechaRegistro(LocalDateTime.now())
                                    .build();
                            acreditadoRepository.save(nuevo);
                        }
                    }
                } catch (Exception rowEx) {
                    logger.warn("Fila {} ignorada por error en importación de acreditados: {}", i, rowEx.getMessage());
                }
            }

            logger.info("Importación de acreditados finalizada.");
            try {
                auditService.log(AccionAuditoria.IMPORTACION_EXCEL, "Importación manual de acreditados", "Sistema", null);
            } catch (Exception e) {
                logger.warn("No se pudo registrar auditoría de acreditados: {}", e.getMessage());
            }

            wsNotificationService.notificarDashboardUpdate();
        }
    }

    @Transactional(readOnly = true)
    public AcreditadoDashboardStats getGeneralStats() {
        long totalAcreditados = acreditadoRepository.count();
        long totalMunicipios = municipioRepository.count();
        long totalPuestos = puestoRepository.count();
        long totalMesas = mesaRepository.count();
        long totalTestigosManuales = testigoRepository.count();

        List<Mesa> mesas = mesaRepository.findAllWithEagerRelationships();
        List<Acreditado> acreditados = acreditadoRepository.findAll();
        List<Testigo> testigosManuales = testigoRepository.findAll();

        // Agrupar por mesaId
        Map<Long, List<Acreditado>> acreditadosByMesa = acreditados.stream()
                .filter(a -> a.getMesa() != null)
                .collect(Collectors.groupingBy(a -> a.getMesa().getId()));

        Map<Long, List<Testigo>> manualesByMesa = testigosManuales.stream()
                .filter(t -> t.getMesa() != null)
                .collect(Collectors.groupingBy(t -> t.getMesa().getId()));

        long mesasVerdes = 0;
        long mesasAmarillas = 0;
        long mesasRojas = 0;

        long mesasGanadas = 0;
        long mesasPerdidas = 0;
        long mesasConfirmadas = 0;

        for (Mesa m : mesas) {
            int numAcreditados = accreditedsCountForMesa(acreditadosByMesa, m.getId());
            int numManuales = manualesCountForMesa(manualesByMesa, m.getId());

            // Clasificación semáforo acreditados
            if (numAcreditados == 0) {
                mesasRojas++;
            } else if (numAcreditados == 1) {
                mesasAmarillas++;
            } else {
                mesasVerdes++;
            }

            // Comparación de Ganados / Perdidos / Confirmados
            if (numAcreditados >= 1 && numManuales == 0) {
                mesasGanadas++;
            } else if (numAcreditados == 0 && numManuales >= 1) {
                mesasPerdidas++;
            } else if (numAcreditados >= 1 && numManuales >= 1) {
                mesasConfirmadas++;
            }
        }

        long mesasCubiertas = mesasVerdes + mesasAmarillas;
        long mesasPendientes = mesasRojas;
        double porcentajeCobertura = totalMesas > 0 ? ((double) mesasCubiertas / totalMesas) * 100 : 0.0;

        return AcreditadoDashboardStats.builder()
                .totalAcreditados(totalAcreditados)
                .totalMunicipios(totalMunicipios)
                .totalPuestos(totalPuestos)
                .totalMesas(totalMesas)
                .mesasVerdes(mesasVerdes)
                .mesasAmarillas(mesasAmarillas)
                .mesasRojas(mesasRojas)
                .mesasCubiertas(mesasCubiertas)
                .mesasPendientes(mesasPendientes)
                .porcentajeCobertura(Math.round(porcentajeCobertura * 100.0) / 100.0)
                .mesasGanadas(mesasGanadas)
                .mesasPerdidas(mesasPerdidas)
                .mesasConfirmadas(mesasConfirmadas)
                .totalTestigosManuales(totalTestigosManuales)
                .build();
    }

    @Transactional(readOnly = true)
    public List<CoberturaMunicipioResponse> getCoberturaMunicipios(Long departamentoId) {
        List<Mesa> mesas = mesaRepository.findAllWithEagerRelationships();
        List<Acreditado> acreditados = acreditadoRepository.findAll();

        if (departamentoId != null) {
            mesas = mesas.stream()
                    .filter(m -> m.getPuesto() != null &&
                            m.getPuesto().getMunicipio() != null &&
                            m.getPuesto().getMunicipio().getDepartamento() != null &&
                            m.getPuesto().getMunicipio().getDepartamento().getId().equals(departamentoId))
                    .collect(Collectors.toList());

            acreditados = accreditedFilterByDepto(acreditados, departamentoId);
        }

        Map<Long, Long> countByMesa = accreditedsCountByMesa(acreditados);

        Map<Municipio, List<Mesa>> mesasByMunicipio = mesas.stream()
                .filter(m -> m.getPuesto() != null && m.getPuesto().getMunicipio() != null)
                .collect(Collectors.groupingBy(m -> m.getPuesto().getMunicipio()));

        List<CoberturaMunicipioResponse> responses = new ArrayList<>();
        for (Map.Entry<Municipio, List<Mesa>> entry : mesasByMunicipio.entrySet()) {
            Municipio municipio = entry.getKey();
            List<Mesa> municipioMesas = entry.getValue();

            long totalMesas = municipioMesas.size();
            long mesasConTestigo = municipioMesas.stream()
                    .filter(m -> countByMesa.getOrDefault(m.getId(), 0L) > 0)
                    .count();
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

        responses.sort((r1, r2) -> {
            int comp = Double.compare(r1.getPorcentajeCobertura(), r2.getPorcentajeCobertura());
            if (comp != 0) return comp;
            return r1.getMunicipioNombre().compareTo(r2.getMunicipioNombre());
        });

        return responses;
    }

    @Transactional(readOnly = true)
    public List<CoberturaPuestoResponse> getCoberturaPuestos(Long municipioId) {
        List<Mesa> mesas = mesaRepository.findAllWithEagerRelationships();
        List<Acreditado> acreditados = acreditadoRepository.findAll();

        if (municipioId != null) {
            mesas = mesas.stream()
                    .filter(m -> m.getPuesto() != null &&
                            m.getPuesto().getMunicipio() != null &&
                            m.getPuesto().getMunicipio().getId().equals(municipioId))
                    .collect(Collectors.toList());

            acreditados = accreditedFilterByMpio(acreditados, municipioId);
        }

        Map<Long, Long> countByMesa = accreditedsCountByMesa(acreditados);

        Map<Puesto, List<Mesa>> mesasByPuesto = mesas.stream()
                .filter(m -> m.getPuesto() != null)
                .collect(Collectors.groupingBy(Mesa::getPuesto));

        List<CoberturaPuestoResponse> responses = new ArrayList<>();
        for (Map.Entry<Puesto, List<Mesa>> entry : mesasByPuesto.entrySet()) {
            Puesto puesto = entry.getKey();
            List<Mesa> puestoMesas = entry.getValue();

            long totalMesas = puestoMesas.size();
            long mesasTotalmenteCubiertas = puestoMesas.stream().filter(m -> countByMesa.getOrDefault(m.getId(), 0L) >= 2).count();
            long mesasParcialmenteCubiertas = puestoMesas.stream().filter(m -> countByMesa.getOrDefault(m.getId(), 0L) == 1).count();
            long mesasSinTestigo = puestoMesas.stream().filter(m -> countByMesa.getOrDefault(m.getId(), 0L) == 0).count();

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

        responses.sort((r1, r2) -> {
            int comp = Double.compare(r1.getPorcentajeCobertura(), r2.getPorcentajeCobertura());
            if (comp != 0) return comp;
            return r1.getPuestoNombre().compareTo(r2.getPuestoNombre());
        });

        return responses;
    }

    @Transactional(readOnly = true)
    public List<AcreditadoResponse> obtenerTodosLosAcreditados() {
        return acreditadoRepository.findAllWithEagerRelationships().stream()
                .map(this::mapToAcreditadoResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ComparativaTestigoResponse> getComparativaTestigos() {
        List<Testigo> testigos = testigoRepository.findAllWithEagerRelationships();
        List<Acreditado> acreditados = acreditadoRepository.findAll();
        
        Set<String> docsAcreditados = acreditados.stream()
                .map(Acreditado::getDocumento)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
                
        return testigos.stream().map(t -> {
            Mesa mesa = t.getMesa();
            Puesto puesto = mesa != null ? mesa.getPuesto() : null;
            Municipio municipio = puesto != null ? puesto.getMunicipio() : null;
            
            return ComparativaTestigoResponse.builder()
                    .idTestigo(t.getId())
                    .documento(t.getDocumento())
                    .nombreCompleto(t.getNombre() + " " + t.getPrimerApellido() + 
                        (t.getSegundoApellido() != null ? " " + t.getSegundoApellido() : ""))
                    .celular(t.getCelular())
                    .correo(t.getCorreo())
                    .mesaId(mesa != null ? mesa.getId() : null)
                    .numeroMesa(mesa != null ? mesa.getNumeroMesa() : null)
                    .puestoId(puesto != null ? puesto.getId() : null)
                    .nombrePuesto(puesto != null ? puesto.getNombrePuesto() : "")
                    .municipioId(municipio != null ? municipio.getId() : null)
                    .nombreMunicipio(municipio != null ? municipio.getNombre() : "")
                    .fueAcreditado(docsAcreditados.contains(t.getDocumento()))
                    .build();
        }).collect(Collectors.toList());
    }

    @Transactional
    public void limpiarAcreditados() {
        acreditadoRepository.deleteAll();
        try {
            auditService.log(AccionAuditoria.ELIMINACION_USUARIO, "Limpieza completa de la tabla de acreditados", "Sistema", null);
        } catch (Exception e) {
            logger.warn("No se pudo registrar auditoría de limpieza de acreditados: {}", e.getMessage());
        }
        wsNotificationService.notificarDashboardUpdate();
    }

    // ── METODOS DE EXPORTACIÓN EXCEL ──────────────────────────────────────────

    @Transactional(readOnly = true)
    public File exportarDatos() throws IOException {
        logger.info("Iniciando exportación de Excel de acreditados...");
        File outputFile = File.createTempFile("Acreditados_Export_", ".xlsx");

        List<Acreditado> list = acreditadoRepository.findAllWithEagerRelationships();

        try (XSSFWorkbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Acreditados");

            CellStyle headerStyle = workbook.createCellStyle();
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerFont.setColor(IndexedColors.WHITE.getIndex());
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(IndexedColors.DARK_BLUE.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            Row headerRow = sheet.createRow(0);
            for (int i = 0; i < HEADERS_DETALLADO.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(HEADERS_DETALLADO[i]);
                cell.setCellStyle(headerStyle);
            }

            int rowIdx = 1;
            for (Acreditado a : list) {
                Row row = sheet.createRow(rowIdx++);
                Mesa mesa = a.getMesa();
                Puesto puesto = mesa != null ? mesa.getPuesto() : null;
                Municipio municipio = puesto != null ? puesto.getMunicipio() : null;
                Departamento depto = municipio != null ? municipio.getDepartamento() : null;

                row.createCell(0).setCellValue(depto != null ? safe(depto.getCodigoDepartamento()) : "");
                row.createCell(1).setCellValue(municipio != null ? safe(municipio.getCodigoMunicipio()) : "");
                row.createCell(2).setCellValue(puesto != null ? safe(puesto.getZona()) : "");
                row.createCell(3).setCellValue(puesto != null ? safe(puesto.getCodigoPuesto()) : "");
                row.createCell(4).setCellValue(depto != null ? safe(depto.getNombre()) : "");
                row.createCell(5).setCellValue(municipio != null ? safe(municipio.getNombre()) : "");
                row.createCell(6).setCellValue(puesto != null ? safe(puesto.getNombrePuesto()) : "");
                row.createCell(7).setCellValue(mesa != null && mesa.getNumeroMesa() != null ? mesa.getNumeroMesa().toString() : "");
                row.createCell(8).setCellValue(safe(a.getNombreOrganizacion()));
                row.createCell(9).setCellValue(safe(a.getDocumento()));
                row.createCell(10).setCellValue(safe(a.getNombreCompleto()));
                row.createCell(11).setCellValue(safe(a.getCelular()));
                row.createCell(12).setCellValue(safe(a.getCorreo()));
                row.createCell(13).setCellValue(safe(a.getTipoTestigo()));
                row.createCell(14).setCellValue(safe(a.getEstado()));
            }

            for (int i = 0; i < HEADERS_DETALLADO.length; i++) {
                sheet.autoSizeColumn(i);
            }

            try (FileOutputStream fos = new FileOutputStream(outputFile)) {
                workbook.write(fos);
            }
        }

        try {
            auditService.log(AccionAuditoria.EXPORTACION_EXCEL, "Exportación de listado de acreditados completa generada", "Excel", null);
        } catch (Exception e) {
            logger.warn("No se pudo registrar auditoría de exportación completa: {}", e.getMessage());
        }

        return outputFile;
    }

    @Transactional(readOnly = true)
    public File exportarCobertura(Long departamentoId) throws IOException {
        logger.info("Iniciando exportación de Excel de cobertura de acreditados...");
        File outputFile = File.createTempFile("Cobertura_Acreditados_Export_", ".xlsx");

        List<CoberturaMunicipioResponse> coberturaList = getCoberturaMunicipios(departamentoId);

        try (XSSFWorkbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Cobertura Acreditados");

            CellStyle headerStyle = workbook.createCellStyle();
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerFont.setColor(IndexedColors.WHITE.getIndex());
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(IndexedColors.DARK_BLUE.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            Row headerRow = sheet.createRow(0);
            for (int i = 0; i < HEADERS_COBERTURA.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(HEADERS_COBERTURA[i]);
                cell.setCellStyle(headerStyle);
            }

            int rowIdx = 1;
            for (CoberturaMunicipioResponse item : coberturaList) {
                Row row = sheet.createRow(rowIdx++);
                row.createCell(0).setCellValue(safe(item.getDepartamentoNombre()));
                row.createCell(1).setCellValue(safe(item.getMunicipioNombre()));
                row.createCell(2).setCellValue(item.getTotalMesas());
                row.createCell(3).setCellValue(item.getMesasConTestigo());
                row.createCell(4).setCellValue(item.getMesasSinTestigo());
                
                Cell pctCell = row.createCell(5);
                pctCell.setCellValue(item.getPorcentajeCobertura() / 100.0);
                
                CellStyle pctStyle = workbook.createCellStyle();
                pctStyle.setDataFormat(workbook.createDataFormat().getFormat("0.00%"));
                pctCell.setCellStyle(pctStyle);
            }

            for (int i = 0; i < HEADERS_COBERTURA.length; i++) {
                sheet.autoSizeColumn(i);
            }

            try (FileOutputStream fos = new FileOutputStream(outputFile)) {
                workbook.write(fos);
            }
        }

        try {
            auditService.log(AccionAuditoria.EXPORTACION_EXCEL, "Exportación de cobertura de acreditados generada", "Excel", null);
        } catch (Exception e) {
            logger.warn("No se pudo registrar auditoría de exportación de cobertura: {}", e.getMessage());
        }

        return outputFile;
    }

    @Transactional(readOnly = true)
    public File exportarTestigosPorMunicipio(Long municipioId) throws IOException {
        logger.info("Iniciando exportación de Excel de acreditados por municipio...");
        Municipio municipio = municipioRepository.findById(municipioId)
                .orElseThrow(() -> new IllegalArgumentException("Municipio no encontrado: " + municipioId));

        List<Acreditado> acreditados = acreditadoRepository.findByMunicipioIdWithEagerRelationships(municipioId);

        File outputFile = File.createTempFile("Acreditados_" + municipio.getNombre().replace(" ", "_") + "_", ".xlsx");

        try (XSSFWorkbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Acreditados " + municipio.getNombre());

            CellStyle headerStyle = workbook.createCellStyle();
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerFont.setColor(IndexedColors.WHITE.getIndex());
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(IndexedColors.DARK_BLUE.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            Row headerRow = sheet.createRow(0);
            for (int i = 0; i < HEADERS_DETALLADO.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(HEADERS_DETALLADO[i]);
                cell.setCellStyle(headerStyle);
            }

            int rowIdx = 1;
            for (Acreditado a : acreditados) {
                Row row = sheet.createRow(rowIdx++);
                Mesa mesa = a.getMesa();
                Puesto puesto = mesa != null ? mesa.getPuesto() : null;
                Departamento depto = municipio.getDepartamento();

                row.createCell(0).setCellValue(depto != null ? safe(depto.getCodigoDepartamento()) : "");
                row.createCell(1).setCellValue(safe(municipio.getCodigoMunicipio()));
                row.createCell(2).setCellValue(puesto != null ? safe(puesto.getZona()) : "");
                row.createCell(3).setCellValue(puesto != null ? safe(puesto.getCodigoPuesto()) : "");
                row.createCell(4).setCellValue(depto != null ? safe(depto.getNombre()) : "");
                row.createCell(5).setCellValue(safe(municipio.getNombre()));
                row.createCell(6).setCellValue(puesto != null ? safe(puesto.getNombrePuesto()) : "");
                row.createCell(7).setCellValue(mesa != null && mesa.getNumeroMesa() != null ? mesa.getNumeroMesa().toString() : "");
                row.createCell(8).setCellValue(safe(a.getNombreOrganizacion()));
                row.createCell(9).setCellValue(safe(a.getDocumento()));
                row.createCell(10).setCellValue(safe(a.getNombreCompleto()));
                row.createCell(11).setCellValue(safe(a.getCelular()));
                row.createCell(12).setCellValue(safe(a.getCorreo()));
                row.createCell(13).setCellValue(safe(a.getTipoTestigo()));
                row.createCell(14).setCellValue(safe(a.getEstado()));
            }

            for (int i = 0; i < HEADERS_DETALLADO.length; i++) {
                sheet.autoSizeColumn(i);
            }

            try (FileOutputStream fos = new FileOutputStream(outputFile)) {
                workbook.write(fos);
            }
        }

        try {
            auditService.log(AccionAuditoria.EXPORTACION_EXCEL, "Exportación de acreditados del municipio " + municipio.getNombre() + " generada", "Excel", null);
        } catch (Exception e) {
            logger.warn("No se pudo registrar auditoría de exportación: {}", e.getMessage());
        }

        return outputFile;
    }

    // ── HELPERS ───────────────────────────────────────────────────────────────

    private AcreditadoResponse mapToAcreditadoResponse(Acreditado a) {
        Mesa mesa = a.getMesa();
        String deptoNombre = ""; Long deptoId = null;
        String mpioNombre  = ""; Long mpioId  = null;
        String puestoNombre= ""; Long puestoId= null;

        if (mesa != null && mesa.getPuesto() != null) {
            puestoNombre = mesa.getPuesto().getNombrePuesto();
            puestoId     = mesa.getPuesto().getId();
            if (mesa.getPuesto().getMunicipio() != null) {
                mpioNombre = mesa.getPuesto().getMunicipio().getNombre();
                mpioId     = mesa.getPuesto().getMunicipio().getId();
                if (mesa.getPuesto().getMunicipio().getDepartamento() != null) {
                    deptoNombre = mesa.getPuesto().getMunicipio().getDepartamento().getNombre();
                    deptoId     = mesa.getPuesto().getMunicipio().getDepartamento().getId();
                }
            }
        }

        return AcreditadoResponse.builder()
                .id(a.getId())
                .documento(a.getDocumento())
                .nombreCompleto(a.getNombreCompleto())
                .celular(a.getCelular())
                .correo(a.getCorreo())
                .nombreOrganizacion(a.getNombreOrganizacion())
                .tipoTestigo(a.getTipoTestigo())
                .estado(a.getEstado())
                .fechaRegistro(a.getFechaRegistro())
                .mesaId(mesa != null ? mesa.getId() : null)
                .numeroMesa(mesa != null ? mesa.getNumeroMesa() : null)
                .puestoId(puestoId)
                .nombrePuesto(puestoNombre)
                .municipioId(mpioId)
                .nombreMunicipio(mpioNombre)
                .departamentoId(deptoId)
                .nombreDepartamento(deptoNombre)
                .build();
    }

    private String getCellValueAsString(Cell cell) {
        if (cell == null) return "";
        switch (cell.getCellType()) {
            case STRING:
                return cell.getStringCellValue().trim();
            case NUMERIC:
                if (cell.getNumericCellValue() == Math.floor(cell.getNumericCellValue())) {
                    return String.valueOf((long) cell.getNumericCellValue());
                }
                return String.valueOf(cell.getNumericCellValue());
            default:
                return "";
        }
    }

    private int accreditedsCountForMesa(Map<Long, List<Acreditado>> accreditedsByMesa, Long mesaId) {
        return accreditedsByMesa.containsKey(mesaId) ? accreditedsByMesa.get(mesaId).size() : 0;
    }

    private int manualesCountForMesa(Map<Long, List<Testigo>> manualesByMesa, Long mesaId) {
        return manualesByMesa.containsKey(mesaId) ? manualesByMesa.get(mesaId).size() : 0;
    }

    private Map<Long, Long> accreditedsCountByMesa(List<Acreditado> list) {
        return list.stream()
                .filter(a -> a.getMesa() != null)
                .collect(Collectors.groupingBy(a -> a.getMesa().getId(), Collectors.counting()));
    }

    private List<Acreditado> accreditedFilterByDepto(List<Acreditado> list, Long deptoId) {
        return list.stream()
                .filter(a -> a.getMesa() != null &&
                        a.getMesa().getPuesto() != null &&
                        a.getMesa().getPuesto().getMunicipio() != null &&
                        a.getMesa().getPuesto().getMunicipio().getDepartamento() != null &&
                        a.getMesa().getPuesto().getMunicipio().getDepartamento().getId().equals(deptoId))
                .collect(Collectors.toList());
    }

    private List<Acreditado> accreditedFilterByMpio(List<Acreditado> list, Long mpioId) {
        return list.stream()
                .filter(a -> a.getMesa() != null &&
                        a.getMesa().getPuesto() != null &&
                        a.getMesa().getPuesto().getMunicipio() != null &&
                        a.getMesa().getPuesto().getMunicipio().getId().equals(mpioId))
                .collect(Collectors.toList());
    }

    private String safe(String val) {
        return val != null ? val : "";
    }
}
