package com.electoral.testigos.service;

import com.electoral.testigos.model.*;
import com.electoral.testigos.model.enums.AccionAuditoria;
import com.electoral.testigos.repository.*;
import com.electoral.testigos.dto.response.CoberturaMunicipioResponse;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.*;
import java.util.List;
import java.util.ArrayList;
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

    @Autowired
    private DashboardService dashboardService;

    @Autowired
    private PuestoRepository puestoRepository;

    @Autowired
    private MunicipioRepository municipioRepository;

    private static final String[] HEADERS = {
        "COD_DEPTO", "COD_MPIO", "ZONA", "COD_PUESTO",
        "NOM_DEPTO", "NOM_MPIO", "NOM_PUESTO",
        "MESA", "NOM_ORGANIZACION", "TIPO_TESTIGO",
        "DOCUMENTO", "NOMBRE", "SEGUNDO_NOMBRE",
        "PRIMER_APELLIDO", "SEGUNDO_APELLIDO", "CELULAR", "CORREO"
    };

    private static final String[] HEADERS_COBERTURA = {
        "DEPARTAMENTO", "MUNICIPIO", "TOTAL MESAS", "MESAS CUBIERTAS", "MESAS SIN COBERTURA", "PORCENTAJE COBERTURA"
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

    @Transactional
    public File exportarCobertura(Long departamentoId) throws IOException {
        logger.info("Iniciando exportación de Excel de cobertura por municipio...");

        File outputFile = File.createTempFile("Cobertura_Municipios_Export_", ".xlsx");

        List<CoberturaMunicipioResponse> coberturaList = dashboardService.getCoberturaMunicipios(departamentoId);

        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Cobertura por Municipio");

            CellStyle headerStyle = workbook.createCellStyle();
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(IndexedColors.LIGHT_CORNFLOWER_BLUE.getIndex());
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
            auditService.log(AccionAuditoria.EXPORTACION_EXCEL, "Exportación de cobertura por municipio generada", "Excel", null);
        } catch (Exception e) {
            logger.warn("No se pudo registrar auditoría de exportación de cobertura: {}", e.getMessage());
        }
        logger.info("Exportación de cobertura finalizada: {} municipios exportados", coberturaList.size());

        return outputFile;
    }

    private String safe(String val) {
        return val != null ? val : "";
    }

    private static final String[] HEADERS_COORDINADORES = {
        "MUNICIPIO", "ZONA", "COD_PUESTO", "PUESTO",
        "DOCUMENTO_COORDINADOR", "NOMBRE_COORDINADOR", "CELULAR_COORDINADOR", "CORREO_COORDINADOR",
        "MESA", "DOCUMENTO_TESTIGO", "NOMBRE_TESTIGO", "CELULAR_TESTIGO", "CORREO_TESTIGO", "ORGANIZACION_TESTIGO", "TIPO_TESTIGO"
    };

    @Transactional
    public File exportarCoordinadores(Long municipioId) throws IOException {
        logger.info("Iniciando exportación de Excel de coordinadores para municipio ID: {}...", municipioId);

        Municipio municipio = municipioRepository.findById(municipioId)
                .orElseThrow(() -> new IllegalArgumentException("Municipio no encontrado con ID: " + municipioId));

        File outputFile = File.createTempFile("Coordinadores_" + municipio.getNombre().replace(" ", "_") + "_", ".xlsx");

        List<Puesto> puestos = puestoRepository.findByMunicipioId(municipioId);

        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Coordinadores y Testigos");

            CellStyle headerStyle = workbook.createCellStyle();
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(IndexedColors.LIGHT_CORNFLOWER_BLUE.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            Row headerRow = sheet.createRow(0);
            for (int i = 0; i < HEADERS_COORDINADORES.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(HEADERS_COORDINADORES[i]);
                cell.setCellStyle(headerStyle);
            }

            int rowIdx = 1;
            for (Puesto puesto : puestos) {
                Testigo coord = puesto.getCoordinador();
                List<Testigo> testigos = testigoRepository.findByPuestoId(puesto.getId());

                if (testigos != null && !testigos.isEmpty()) {
                    for (Testigo testigo : testigos) {
                        Row row = sheet.createRow(rowIdx++);
                        writePuestoAndCoordinator(row, municipio.getNombre(), puesto, coord);
                        
                        row.createCell(8).setCellValue(testigo.getMesa() != null && testigo.getMesa().getNumeroMesa() != null ? testigo.getMesa().getNumeroMesa().toString() : "");
                        row.createCell(9).setCellValue(safe(testigo.getDocumento()));
                        row.createCell(10).setCellValue(safe(testigo.getNombreCompleto()));
                        row.createCell(11).setCellValue(safe(testigo.getCelular()));
                        row.createCell(12).setCellValue(safe(testigo.getCorreo()));
                        row.createCell(13).setCellValue(safe(testigo.getNombreOrganizacion()));
                        row.createCell(14).setCellValue(testigo.getTipoTestigo() != null ? testigo.getTipoTestigo().name() : "");
                    }
                } else {
                    Row row = sheet.createRow(rowIdx++);
                    writePuestoAndCoordinator(row, municipio.getNombre(), puesto, coord);
                }
            }

            for (int i = 0; i < HEADERS_COORDINADORES.length; i++) {
                sheet.autoSizeColumn(i);
            }

            try (FileOutputStream fos = new FileOutputStream(outputFile)) {
                workbook.write(fos);
            }
        }

        try {
            auditService.log(AccionAuditoria.EXPORTACION_EXCEL, "Exportación de coordinadores de puestos de " + municipio.getNombre() + " generada", "Excel", null);
        } catch (Exception e) {
            logger.warn("No se pudo registrar auditoría de exportación de coordinadores: {}", e.getMessage());
        }

        return outputFile;
    }

    private void writePuestoAndCoordinator(Row row, String municipioNombre, Puesto puesto, Testigo coord) {
        row.createCell(0).setCellValue(safe(municipioNombre));
        row.createCell(1).setCellValue(puesto != null ? safe(puesto.getZona()) : "");
        row.createCell(2).setCellValue(puesto != null ? safe(puesto.getCodigoPuesto()) : "");
        row.createCell(3).setCellValue(puesto != null ? safe(puesto.getNombrePuesto()) : "");
        
        if (coord != null) {
            row.createCell(4).setCellValue(safe(coord.getDocumento()));
            row.createCell(5).setCellValue(safe(coord.getNombreCompleto()));
            row.createCell(6).setCellValue(safe(coord.getCelular()));
            row.createCell(7).setCellValue(safe(coord.getCorreo()));
        } else {
            row.createCell(4).setCellValue("");
            row.createCell(5).setCellValue("SIN COORDINADOR ASIGNADO");
            row.createCell(6).setCellValue("");
            row.createCell(7).setCellValue("");
        }
    }
}
