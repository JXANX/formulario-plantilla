package com.electoral.testigos.service;

import com.electoral.testigos.model.*;
import com.electoral.testigos.model.enums.AccionAuditoria;
import com.electoral.testigos.model.enums.TipoTestigo;
import com.electoral.testigos.repository.*;
import org.apache.poi.ss.usermodel.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.time.LocalDateTime;
import java.util.Optional;


@Service
public class ExcelImportService {

    private static final Logger logger = LoggerFactory.getLogger(ExcelImportService.class);

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

    @Autowired
    private AuditService auditService;

    @Autowired
    private WebSocketNotificationService wsNotificationService;

    public void importarPlantilla(InputStream is, boolean isInitialLoad) throws Exception {
        logger.info("Iniciando importación de plantilla Excel...");

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

                    // Skip completely empty rows
                    boolean isRowEmpty = true;
                    for (int c = 0; c < 17; c++) {
                        if (!getCellValueAsString(row.getCell(c)).isEmpty()) {
                            isRowEmpty = false;
                            break;
                        }
                    }
                    if (isRowEmpty) continue;

                    String codDepto = getCellValueAsString(row.getCell(0));
                    String codMpio = getCellValueAsString(row.getCell(1));
                    String zona = getCellValueAsString(row.getCell(2));
                    String codPuesto = getCellValueAsString(row.getCell(3));
                    String nomDepto = getCellValueAsString(row.getCell(4));
                    String nomMpio = getCellValueAsString(row.getCell(5));
                    String nomPuesto = getCellValueAsString(row.getCell(6));
                    String mesaStr = getCellValueAsString(row.getCell(7));

                    String nomOrg = getCellValueAsString(row.getCell(8));
                    String tipoTestigoStr = getCellValueAsString(row.getCell(9));
                    String documento = getCellValueAsString(row.getCell(10));
                    String nombre = getCellValueAsString(row.getCell(11));
                    String segundoNombre = getCellValueAsString(row.getCell(12));
                    String apellido = getCellValueAsString(row.getCell(13));
                    String segundoApellido = getCellValueAsString(row.getCell(14));
                    String celular = getCellValueAsString(row.getCell(15));
                    String correo = getCellValueAsString(row.getCell(16));

                    // Build hierarchy only if we have codes
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
                        final String fZona = zona;
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

                    // Process testigo if documento exists
                    if (!documento.isEmpty()) {
                        TipoTestigo tipo = TipoTestigo.PRINCIPAL;
                        if ("SUPLENTE".equalsIgnoreCase(tipoTestigoStr)) {
                            tipo = TipoTestigo.SUPLENTE;
                        }

                        Optional<Testigo> existingOpt = testigoRepository.findByDocumento(documento);
                        if (existingOpt.isPresent()) {
                            Testigo existing = existingOpt.get();
                            if (!nombre.isEmpty()) existing.setNombre(nombre.toUpperCase());
                            if (!segundoNombre.isEmpty()) existing.setSegundoNombre(segundoNombre.toUpperCase());
                            if (!apellido.isEmpty()) existing.setPrimerApellido(apellido.toUpperCase());
                            if (!segundoApellido.isEmpty()) existing.setSegundoApellido(segundoApellido.toUpperCase());
                            if (!celular.isEmpty()) existing.setCelular(celular);
                            if (!correo.isEmpty()) existing.setCorreo(correo);
                            if (!nomOrg.isEmpty()) existing.setNombreOrganizacion(nomOrg);
                            existing.setTipoTestigo(tipo);

                            // Update mesa assignment if we have a new one
                            if (mesa != null) {
                                Mesa oldMesa = existing.getMesa();
                                if (oldMesa == null || !oldMesa.getId().equals(mesa.getId())) {
                                    if (oldMesa != null) {
                                        oldMesa.setOcupados(Math.max(0, oldMesa.getOcupados() - 1));
                                        mesaRepository.save(oldMesa);
                                    }
                                    existing.setMesa(mesa);
                                    mesa.setOcupados(mesa.getOcupados() + 1);
                                    mesaRepository.save(mesa);
                                }
                            }
                            testigoRepository.save(existing);
                        } else if (mesa != null) {
                            // Only create new testigo if we have a mesa to assign
                            Testigo testigo = Testigo.builder()
                                    .documento(documento)
                                    .nombre(nombre.toUpperCase())
                                    .segundoNombre(!segundoNombre.isEmpty() ? segundoNombre.toUpperCase() : null)
                                    .primerApellido(apellido.toUpperCase())
                                    .segundoApellido(!segundoApellido.isEmpty() ? segundoApellido.toUpperCase() : null)
                                    .celular(celular)
                                    .correo(correo)
                                    .nombreOrganizacion(nomOrg)
                                    .tipoTestigo(tipo)
                                    .mesa(mesa)
                                    .fechaRegistro(LocalDateTime.now())
                                    .build();
                            testigoRepository.save(testigo);
                            mesa.setOcupados(mesa.getOcupados() + 1);
                            mesaRepository.save(mesa);
                        }
                    }
                } catch (Exception rowEx) {
                    logger.warn("Fila {} ignorada por error: {}", i, rowEx.getMessage());
                    // Continue with next row, don't abort the whole import
                }
            }

            logger.info("Importación de plantilla finalizada correctamente.");

            if (!isInitialLoad) {
                try {
                    auditService.log(AccionAuditoria.IMPORTACION_EXCEL, "Importación manual de plantilla Excel", "Sistema", null);
                } catch (Exception e) {
                    logger.warn("No se pudo registrar auditoría: {}", e.getMessage());
                }
            }
        }
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
}
