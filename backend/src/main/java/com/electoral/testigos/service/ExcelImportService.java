package com.electoral.testigos.service;

import com.electoral.testigos.model.*;
import com.electoral.testigos.model.enums.AccionAuditoria;
import com.electoral.testigos.model.enums.TipoTestigo;
import com.electoral.testigos.repository.*;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.time.LocalDateTime;

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

            // We assume row 0 is headers, data starts at row 1
            for (int i = 1; i <= lastRowNum; i++) {
                if (i % 10 == 0 || i == lastRowNum) {
                    wsNotificationService.notificarProgresoImportacion(i, lastRowNum);
                }
                Row row = sheet.getRow(i);
                if (row == null) continue;

                boolean isRowEmpty = true;
                for (int c = 0; c < 17; c++) {
                    if (!getCellValueAsString(row.getCell(c)).isEmpty()) {
                        isRowEmpty = false;
                        break;
                    }
                }
                if (isRowEmpty) continue; // Skip completely empty rows

                // Extract hierarchical data
                String codDepto = getCellValueAsString(row.getCell(0));

                String codMpio = getCellValueAsString(row.getCell(1));
                String zona = getCellValueAsString(row.getCell(2));
                String codPuesto = getCellValueAsString(row.getCell(3));
                
                String nomDepto = getCellValueAsString(row.getCell(4));
                String nomMpio = getCellValueAsString(row.getCell(5));
                String nomPuesto = getCellValueAsString(row.getCell(6));
                
                String mesaStr = getCellValueAsString(row.getCell(7));

                // 1. Departamento
                Departamento departamento = departamentoRepository.findByCodigoDepartamento(codDepto)
                        .orElseGet(() -> departamentoRepository.save(Departamento.builder()
                                .codigoDepartamento(codDepto)
                                .nombre(nomDepto)
                                .build()));

                // 2. Municipio
                Municipio municipio = municipioRepository.findByCodigoMunicipio(codMpio)
                        .orElseGet(() -> municipioRepository.save(Municipio.builder()
                                .codigoMunicipio(codMpio)
                                .nombre(nomMpio)
                                .departamento(departamento)
                                .build()));

                // 3. Puesto
                Puesto puesto = puestoRepository.findByCodigoPuestoAndMunicipioIdAndZona(codPuesto, municipio.getId(), zona)
                        .orElseGet(() -> puestoRepository.save(Puesto.builder()
                                .codigoPuesto(codPuesto)
                                .nombrePuesto(nomPuesto)
                                .zona(zona)
                                .municipio(municipio)
                                .build()));

                String documento = getCellValueAsString(row.getCell(10));

                // 4. Mesa
                if (!mesaStr.isEmpty()) {
                    int numMesa = 0;
                    try {
                        numMesa = Integer.parseInt(mesaStr.replaceAll("[^0-9]", ""));
                    } catch (NumberFormatException e) {
                        logger.warn("Formato de mesa inválido: " + mesaStr + ", usando 0 por defecto");
                    }
                    int finalNumMesa = numMesa;
                    
                    Mesa mesa = mesaRepository.findByPuestoIdAndNumeroMesa(puesto.getId(), finalNumMesa)
                            .orElseGet(() -> mesaRepository.save(Mesa.builder()
                                    .puesto(puesto)
                                    .numeroMesa(finalNumMesa)
                                    .capacidad(2) // Default max 2 testigos por mesa
                                    .ocupados(0)
                                    .build()));

                    // 5. Check if there is a witness in this row
                    String nomOrg = getCellValueAsString(row.getCell(8));
                    String tipoTestigoStr = getCellValueAsString(row.getCell(9));
                    
                    if (!documento.isEmpty()) {
                        String nombre = getCellValueAsString(row.getCell(11));
                        String segundoNombre = getCellValueAsString(row.getCell(12));
                        String apellido = getCellValueAsString(row.getCell(13));
                        String segundoApellido = getCellValueAsString(row.getCell(14));
                        String celular = getCellValueAsString(row.getCell(15));
                        String correo = getCellValueAsString(row.getCell(16));

                        TipoTestigo tipo = TipoTestigo.PRINCIPAL;
                        if ("SUPLENTE".equalsIgnoreCase(tipoTestigoStr)) {
                            tipo = TipoTestigo.SUPLENTE;
                        }

                        java.util.Optional<Testigo> existingOpt = testigoRepository.findByDocumento(documento);
                        if (existingOpt.isPresent()) {
                            Testigo existing = existingOpt.get();
                            existing.setNombre(nombre.toUpperCase());
                            existing.setSegundoNombre(segundoNombre != null ? segundoNombre.toUpperCase() : null);
                            existing.setPrimerApellido(apellido.toUpperCase());
                            existing.setSegundoApellido(segundoApellido != null ? segundoApellido.toUpperCase() : null);
                            existing.setCelular(celular);
                            existing.setCorreo(correo);
                            existing.setNombreOrganizacion(nomOrg);
                            existing.setTipoTestigo(tipo);

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
                            testigoRepository.save(existing);
                        } else {
                            Testigo testigo = Testigo.builder()
                                    .documento(documento)
                                    .nombre(nombre.toUpperCase())
                                    .segundoNombre(segundoNombre != null ? segundoNombre.toUpperCase() : null)
                                    .primerApellido(apellido.toUpperCase())
                                    .segundoApellido(segundoApellido != null ? segundoApellido.toUpperCase() : null)
                                    .celular(celular)
                                    .correo(correo)
                                    .nombreOrganizacion(nomOrg)
                                    .tipoTestigo(tipo)
                                    .mesa(mesa)
                                    .fechaRegistro(LocalDateTime.now())
                                    .build();

                            testigoRepository.save(testigo);
                            
                            // Increment mesa occupation
                            mesa.setOcupados(mesa.getOcupados() + 1);
                            mesaRepository.save(mesa);
                        }
                    }
                } else if (!documento.isEmpty()) {
                    // Update testigo directly if mesa is not specified
                    java.util.Optional<Testigo> existingOpt = testigoRepository.findByDocumento(documento);
                    if (existingOpt.isPresent()) {
                        String nombre = getCellValueAsString(row.getCell(11));
                        String segundoNombre = getCellValueAsString(row.getCell(12));
                        String apellido = getCellValueAsString(row.getCell(13));
                        String segundoApellido = getCellValueAsString(row.getCell(14));
                        String celular = getCellValueAsString(row.getCell(15));
                        String correo = getCellValueAsString(row.getCell(16));
                        String nomOrg = getCellValueAsString(row.getCell(8));
                        
                        Testigo existing = existingOpt.get();
                        if (!nombre.isEmpty()) existing.setNombre(nombre.toUpperCase());
                        if (!segundoNombre.isEmpty()) existing.setSegundoNombre(segundoNombre.toUpperCase());
                        if (!apellido.isEmpty()) existing.setPrimerApellido(apellido.toUpperCase());
                        if (!segundoApellido.isEmpty()) existing.setSegundoApellido(segundoApellido.toUpperCase());
                        if (!celular.isEmpty()) existing.setCelular(celular);
                        if (!correo.isEmpty()) existing.setCorreo(correo);
                        if (!nomOrg.isEmpty()) existing.setNombreOrganizacion(nomOrg);
                        
                        testigoRepository.save(existing);
                    }
                }
            }
            
            logger.info("Importación de plantilla finalizada correctamente.");
            
            if (!isInitialLoad) {
                auditService.log(AccionAuditoria.IMPORTACION_EXCEL, "Importación manual de plantilla Excel", "Sistema", null);
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
