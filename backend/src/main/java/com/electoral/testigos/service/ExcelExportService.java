package com.electoral.testigos.service;

import com.electoral.testigos.model.Mesa;
import com.electoral.testigos.model.Testigo;
import com.electoral.testigos.model.enums.AccionAuditoria;
import com.electoral.testigos.repository.MesaRepository;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.*;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;

@Service
public class ExcelExportService {

    private static final Logger logger = LoggerFactory.getLogger(ExcelExportService.class);

    @Value("${app.excel.template-path}")
    private String templatePath;

    @Value("${app.excel.export-dir}")
    private String exportDir;

    @Autowired
    private MesaRepository mesaRepository;

    @Autowired
    private com.electoral.testigos.repository.MunicipioRepository municipioRepository;

    @Autowired
    private com.electoral.testigos.repository.PuestoRepository puestoRepository;

    @Autowired
    private com.electoral.testigos.repository.TestigoRepository testigoRepository;

    @Autowired
    private AuditService auditService;

    @Autowired
    private WebSocketNotificationService wsNotificationService;

    public File exportarDatos() throws IOException {
        logger.info("Iniciando exportación avanzada de Excel utilizando plantilla base");
        
        // Ensure export dir exists
        File dir = new File(exportDir);
        if (!dir.exists()) {
            dir.mkdirs();
        }

        // Get template file path
        String actualTemplatePath = templatePath.replace("classpath:", "src/main/resources/");
        File templateFile = new File(actualTemplatePath);
        
        if (!templateFile.exists()) {
            // Try fallback
            actualTemplatePath = "C:/Users/JXANX/Desktop/Formulario Plantilla/PLANTILLA_DEFINITIVA_QUINDIO_CONSOLIDADA.xlsx";
            templateFile = new File(actualTemplatePath);
        }
        
        if (!templateFile.exists()) {
            throw new FileNotFoundException("No se encontró la plantilla base en: " + actualTemplatePath);
        }

        // Generate output filename
        DateTimeFormatter dtf = DateTimeFormatter.ofPattern("yyyy_MM_dd_HH_mm");
        String filename = "PLANTILLA_DEFINITIVA_QUINDIO_CONSOLIDADA_" + dtf.format(LocalDateTime.now()) + ".xlsx";
        File outputFile = new File(exportDir, filename);

        // Preload data into maps for fast lookups (avoid N+1 query pattern)
        java.util.List<com.electoral.testigos.model.Municipio> municipios = municipioRepository.findAll();
        java.util.Map<String, com.electoral.testigos.model.Municipio> municipioMap = municipios.stream()
                .collect(java.util.stream.Collectors.toMap(com.electoral.testigos.model.Municipio::getCodigoMunicipio, m -> m, (m1, m2) -> m1));

        java.util.List<com.electoral.testigos.model.Puesto> puestos = puestoRepository.findAll();
        java.util.Map<String, com.electoral.testigos.model.Puesto> puestoMap = puestos.stream()
                .collect(java.util.stream.Collectors.toMap(p -> p.getCodigoPuesto() + "_" + p.getMunicipio().getId() + "_" + p.getZona(), p -> p, (p1, p2) -> p1));

        java.util.List<Mesa> mesas = mesaRepository.findAll();
        java.util.Map<String, Mesa> mesaMap = mesas.stream()
                .collect(java.util.stream.Collectors.toMap(m -> m.getPuesto().getId() + "_" + m.getNumeroMesa(), m -> m, (m1, m2) -> m1));

        java.util.List<Testigo> testigos = testigoRepository.findAll();
        java.util.Map<String, Testigo> testigoMap = testigos.stream()
                .collect(java.util.stream.Collectors.toMap(t -> t.getMesa().getId() + "_" + t.getTipoTestigo().name(), t -> t, (t1, t2) -> t1));

        // Process using Apache POI
        try (FileInputStream fis = new FileInputStream(templateFile);
             Workbook workbook = new XSSFWorkbook(fis)) {
             
            Sheet sheet = workbook.getSheetAt(0);
            int lastRowNum = sheet.getLastRowNum();
            
            // Loop through template rows starting from data (row 2 - index 1)
            for (int i = 1; i <= lastRowNum; i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;
                
                String codMpio = getCellValueAsString(row.getCell(1));
                String zona = getCellValueAsString(row.getCell(2));
                String codPuesto = getCellValueAsString(row.getCell(3));
                String mesaStr = getCellValueAsString(row.getCell(7));
                String tipoTestigoStr = getCellValueAsString(row.getCell(9));
                
                if (!codMpio.isEmpty() && !codPuesto.isEmpty() && !mesaStr.isEmpty()) {
                    com.electoral.testigos.model.Municipio mpio = municipioMap.get(codMpio);
                    if (mpio != null) {
                        com.electoral.testigos.model.Puesto puesto = puestoMap.get(codPuesto + "_" + mpio.getId() + "_" + zona);
                        if (puesto != null) {
                            try {
                                int numMesa = Integer.parseInt(mesaStr);
                                Mesa mesa = mesaMap.get(puesto.getId() + "_" + numMesa);
                                if (mesa != null) {
                                    String tipoStr = "SUPLENTE".equalsIgnoreCase(tipoTestigoStr) ? "SUPLENTE" : "PRINCIPAL";
                                    Testigo testigo = testigoMap.get(mesa.getId() + "_" + tipoStr);
                                    if (testigo != null) {
                                        // Escribir los datos del testigo en la fila
                                        setCellStringValue(row, 8, testigo.getNombreOrganizacion());
                                        setCellStringValue(row, 9, testigo.getTipoTestigo().name());
                                        setCellStringValue(row, 10, testigo.getDocumento());
                                        setCellStringValue(row, 11, testigo.getNombre());
                                        setCellStringValue(row, 12, testigo.getSegundoNombre());
                                        setCellStringValue(row, 13, testigo.getPrimerApellido());
                                        setCellStringValue(row, 14, testigo.getSegundoApellido());
                                        setCellStringValue(row, 15, testigo.getCelular());
                                        setCellStringValue(row, 16, testigo.getCorreo());
                                    } else {
                                        // Limpiar las columnas del testigo si no hay testigo registrado en la BD para este slot
                                        setCellStringValue(row, 10, "");
                                        setCellStringValue(row, 11, "");
                                        setCellStringValue(row, 12, "");
                                        setCellStringValue(row, 13, "");
                                        setCellStringValue(row, 14, "");
                                        setCellStringValue(row, 15, "");
                                        setCellStringValue(row, 16, "");
                                    }
                                }
                            } catch (NumberFormatException e) {
                                // ignore
                            }
                        }
                    }
                }
            }
            
            // Write to output file
            try (FileOutputStream fos = new FileOutputStream(outputFile)) {
                workbook.write(fos);
            }
        }
        
        auditService.log(AccionAuditoria.EXPORTACION_EXCEL, "Exportación de plantilla generada: " + filename, "Excel", null);
        
        return outputFile;
    }
    
    private void setCellStringValue(Row row, int colIdx, String val) {
        Cell cell = row.getCell(colIdx);
        if (cell == null) {
            cell = row.createCell(colIdx, CellType.STRING);
        }
        cell.setCellValue(val != null ? val : "");
    }
    
    private String getCellValueAsString(Cell cell) {
        if (cell == null) return "";
        
        switch (cell.getCellType()) {
            case STRING:
                return cell.getStringCellValue().trim();
            case NUMERIC:
                // Handle integers format
                if (cell.getNumericCellValue() == Math.floor(cell.getNumericCellValue())) {
                    return String.valueOf((long) cell.getNumericCellValue());
                }
                return String.valueOf(cell.getNumericCellValue());
            default:
                return "";
        }
    }
}
