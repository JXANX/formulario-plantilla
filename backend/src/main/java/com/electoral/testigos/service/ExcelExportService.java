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
import java.util.stream.Collectors;

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

    @Transactional
    public File exportarDatos() throws IOException {
        logger.info("Iniciando exportación de Excel desde la base de datos...");

        File outputFile = File.createTempFile("Testigos_Electorales_Export_", ".xlsx");

        List<Mesa> mesas = mesaRepository.findAllWithEagerRelationships();
        List<Testigo> allTestigos = testigoRepository.findAllWithEagerRelationships();

        // Group testigos by mesa, safely handling null mesa
        java.util.Map<Long, java.util.List<Testigo>> testigosByMesa = allTestigos.stream()
                .filter(t -> t.getMesa() != null && t.getMesa().getId() != null)
                .collect(Collectors.groupingBy(t -> t.getMesa().getId()));

        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Plantilla");

            CellStyle headerStyle = workbook.createCellStyle();
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(IndexedColors.LIGHT_CORNFLOWER_BLUE.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            Row headerRow = sheet.createRow(0);
            for (int i = 0; i < HEADERS.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(HEADERS[i]);
                cell.setCellStyle(headerStyle);
            }

            int rowIdx = 1;

            for (Mesa mesa : mesas) {
                Puesto puesto = mesa.getPuesto();
                Municipio municipio = puesto != null ? puesto.getMunicipio() : null;
                Departamento departamento = municipio != null ? municipio.getDepartamento() : null;

                java.util.List<Testigo> testigos = mesa.getId() != null ? testigosByMesa.get(mesa.getId()) : null;

                if (testigos != null && !testigos.isEmpty()) {
                    for (Testigo testigo : testigos) {
                        Row row = sheet.createRow(rowIdx++);
                        writeBaseColumns(row, departamento, municipio, puesto, mesa);
                        row.createCell(8).setCellValue(safe(testigo.getNombreOrganizacion()));
                        row.createCell(9).setCellValue(testigo.getTipoTestigo() != null ? testigo.getTipoTestigo().name() : "");
                        row.createCell(10).setCellValue(safe(testigo.getDocumento()));
                        row.createCell(11).setCellValue(safe(testigo.getNombre()));
                        row.createCell(12).setCellValue(safe(testigo.getSegundoNombre()));
                        row.createCell(13).setCellValue(safe(testigo.getPrimerApellido()));
                        row.createCell(14).setCellValue(safe(testigo.getSegundoApellido()));
                        row.createCell(15).setCellValue(safe(testigo.getCelular()));
                        row.createCell(16).setCellValue(safe(testigo.getCorreo()));
                    }
                } else {
                    Row row = sheet.createRow(rowIdx++);
                    writeBaseColumns(row, departamento, municipio, puesto, mesa);
                }
            }

            for (int i = 0; i < HEADERS.length; i++) {
                sheet.autoSizeColumn(i);
            }

            try (FileOutputStream fos = new FileOutputStream(outputFile)) {
                workbook.write(fos);
            }
        }

        try {
            auditService.log(AccionAuditoria.EXPORTACION_EXCEL, "Exportación de datos generada", "Excel", null);
        } catch (Exception e) {
            logger.warn("No se pudo registrar auditoría de exportación: {}", e.getMessage());
        }
        logger.info("Exportación finalizada: {} filas generadas", mesas.size());

        return outputFile;
    }

    private void writeBaseColumns(Row row, Departamento depto, Municipio mpio, Puesto puesto, Mesa mesa) {
        row.createCell(0).setCellValue(depto != null ? safe(depto.getCodigoDepartamento()) : "");
        row.createCell(1).setCellValue(mpio != null ? safe(mpio.getCodigoMunicipio()) : "");
        row.createCell(2).setCellValue(puesto != null ? safe(puesto.getZona()) : "");
        row.createCell(3).setCellValue(puesto != null ? safe(puesto.getCodigoPuesto()) : "");
        row.createCell(4).setCellValue(depto != null ? safe(depto.getNombre()) : "");
        row.createCell(5).setCellValue(mpio != null ? safe(mpio.getNombre()) : "");
        row.createCell(6).setCellValue(puesto != null ? safe(puesto.getNombrePuesto()) : "");
        row.createCell(7).setCellValue(mesa != null && mesa.getNumeroMesa() != null ? mesa.getNumeroMesa().toString() : "");
    }

    private String safe(String val) {
        return val != null ? val : "";
    }
}
