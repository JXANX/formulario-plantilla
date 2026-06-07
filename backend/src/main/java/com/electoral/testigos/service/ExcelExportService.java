package com.electoral.testigos.service;

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

import java.io.*;
import java.util.List;

@Service
public class ExcelExportService {

    private static final Logger logger = LoggerFactory.getLogger(ExcelExportService.class);

    @Autowired
    private MesaRepository mesaRepository;

    @Autowired
    private TestigoRepository testigoRepository;

    @Autowired
    private AuditService auditService;

    private static final String[] HEADERS = {
        "COD_DEPTO", "COD_MPIO", "ZONA", "COD_PUESTO",
        "NOM_DEPTO", "NOM_MPIO", "NOM_PUESTO",
        "MESA", "NOM_ORGANIZACION", "TIPO_TESTIGO",
        "DOCUMENTO", "NOMBRE", "SEGUNDO_NOMBRE",
        "PRIMER_APELLIDO", "SEGUNDO_APELLIDO", "CELULAR", "CORREO"
    };

    @Transactional(readOnly = true)
    public File exportarDatos() throws IOException {
        logger.info("Iniciando exportación de Excel desde la base de datos...");

        // Create temp file
        File outputFile = File.createTempFile("Testigos_Electorales_Export_", ".xlsx");

        // Load all mesas with their relationships
        List<Mesa> mesas = mesaRepository.findAllWithEagerRelationships();

        // Build a map of mesa -> testigos
        List<Testigo> allTestigos = testigoRepository.findAllWithEagerRelationships();
        java.util.Map<Long, java.util.List<Testigo>> testigosByMesa = allTestigos.stream()
                .collect(java.util.stream.Collectors.groupingBy(t -> t.getMesa().getId()));

        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Plantilla");

            // Create header style
            CellStyle headerStyle = workbook.createCellStyle();
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(IndexedColors.LIGHT_CORNFLOWER_BLUE.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            // Write headers
            Row headerRow = sheet.createRow(0);
            for (int i = 0; i < HEADERS.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(HEADERS[i]);
                cell.setCellStyle(headerStyle);
            }

            int rowIdx = 1;

            for (Mesa mesa : mesas) {
                Puesto puesto = mesa.getPuesto();
                if (puesto == null) continue;
                Municipio municipio = puesto.getMunicipio();
                if (municipio == null) continue;
                Departamento departamento = municipio.getDepartamento();
                if (departamento == null) continue;

                java.util.List<Testigo> testigos = testigosByMesa.get(mesa.getId());

                if (testigos != null && !testigos.isEmpty()) {
                    // Write one row per testigo
                    for (Testigo testigo : testigos) {
                        Row row = sheet.createRow(rowIdx++);
                        writeBaseColumns(row, departamento, municipio, puesto, mesa);
                        row.createCell(8).setCellValue(safe(testigo.getNombreOrganizacion()));
                        row.createCell(9).setCellValue(testigo.getTipoTestigo().name());
                        row.createCell(10).setCellValue(safe(testigo.getDocumento()));
                        row.createCell(11).setCellValue(safe(testigo.getNombre()));
                        row.createCell(12).setCellValue(safe(testigo.getSegundoNombre()));
                        row.createCell(13).setCellValue(safe(testigo.getPrimerApellido()));
                        row.createCell(14).setCellValue(safe(testigo.getSegundoApellido()));
                        row.createCell(15).setCellValue(safe(testigo.getCelular()));
                        row.createCell(16).setCellValue(safe(testigo.getCorreo()));
                    }
                } else {
                    // Write the mesa row without testigo data
                    Row row = sheet.createRow(rowIdx++);
                    writeBaseColumns(row, departamento, municipio, puesto, mesa);
                }
            }

            // Auto-size columns
            for (int i = 0; i < HEADERS.length; i++) {
                sheet.autoSizeColumn(i);
            }

            // Write to file
            try (FileOutputStream fos = new FileOutputStream(outputFile)) {
                workbook.write(fos);
            }
        }

        auditService.log(AccionAuditoria.EXPORTACION_EXCEL, "Exportación de datos generada", "Excel", null);
        logger.info("Exportación finalizada: {} filas generadas", mesas.size());

        return outputFile;
    }

    private void writeBaseColumns(Row row, Departamento depto, Municipio mpio, Puesto puesto, Mesa mesa) {
        row.createCell(0).setCellValue(safe(depto.getCodigoDepartamento()));
        row.createCell(1).setCellValue(safe(mpio.getCodigoMunicipio()));
        row.createCell(2).setCellValue(safe(puesto.getZona()));
        row.createCell(3).setCellValue(safe(puesto.getCodigoPuesto()));
        row.createCell(4).setCellValue(safe(depto.getNombre()));
        row.createCell(5).setCellValue(safe(mpio.getNombre()));
        row.createCell(6).setCellValue(safe(puesto.getNombrePuesto()));
        row.createCell(7).setCellValue(mesa.getNumeroMesa());
    }

    private String safe(String val) {
        return val != null ? val : "";
    }
}
