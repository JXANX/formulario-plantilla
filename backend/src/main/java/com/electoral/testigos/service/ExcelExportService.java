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

    private static final String[] HEADERS_TESTIGOS_MUNICIPIO = {
        "MUNICIPIO", "PUESTO", "ZONA", "MESA", "TIPO_TESTIGO",
        "DOCUMENTO", "NOMBRE COMPLETO", "CELULAR", "CORREO", "ORGANIZACIÓN"
    };

    @Transactional
    public File exportarTestigosPorMunicipio(Long municipioId) throws IOException {
        Municipio municipio = municipioRepository.findById(municipioId)
                .orElseThrow(() -> new IllegalArgumentException("Municipio no encontrado: " + municipioId));

        List<Testigo> testigos = testigoRepository.findByMunicipioId(municipioId);

        File outputFile = File.createTempFile("Testigos_" + municipio.getNombre().replace(" ", "_") + "_", ".xlsx");

        try (XSSFWorkbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Testigos " + municipio.getNombre());

            org.apache.poi.xssf.usermodel.XSSFCellStyle headerStyle = workbook.createCellStyle();
            org.apache.poi.xssf.usermodel.XSSFFont headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerFont.setColor(IndexedColors.WHITE.getIndex());
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(new org.apache.poi.xssf.usermodel.XSSFColor(new byte[]{(byte)0x1F,(byte)0x3D,(byte)0x7A}, null));
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            setBorderThin(headerStyle, BorderStyle.THIN.getCode());

            org.apache.poi.xssf.usermodel.XSSFCellStyle rowStyle = workbook.createCellStyle();
            org.apache.poi.xssf.usermodel.XSSFFont rowFont = workbook.createFont();
            rowFont.setFontHeightInPoints((short) 10);
            rowStyle.setFont(rowFont);
            setBorderThin(rowStyle, BorderStyle.THIN.getCode());

            org.apache.poi.xssf.usermodel.XSSFCellStyle rowAltStyle = workbook.createCellStyle();
            rowAltStyle.cloneStyleFrom(rowStyle);
            rowAltStyle.setFillForegroundColor(new org.apache.poi.xssf.usermodel.XSSFColor(new byte[]{(byte)0xF2,(byte)0xF5,(byte)0xFA}, null));
            rowAltStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            Row headerRow = sheet.createRow(0);
            headerRow.setHeightInPoints(22);
            for (int i = 0; i < HEADERS_TESTIGOS_MUNICIPIO.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(HEADERS_TESTIGOS_MUNICIPIO[i]);
                cell.setCellStyle(headerStyle);
            }

            int rowIdx = 1;
            for (Testigo t : testigos) {
                org.apache.poi.xssf.usermodel.XSSFCellStyle style = (rowIdx % 2 == 1) ? rowStyle : rowAltStyle;
                Row row = sheet.createRow(rowIdx++);
                Mesa mesa   = t.getMesa();
                Puesto puesto = mesa != null ? mesa.getPuesto() : null;
                createStyledCell(row, 0, municipio.getNombre(), style);
                createStyledCell(row, 1, puesto != null ? safe(puesto.getNombrePuesto()) : "", style);
                createStyledCell(row, 2, puesto != null ? safe(puesto.getZona()) : "", style);
                createStyledCell(row, 3, mesa != null && mesa.getNumeroMesa() != null ? mesa.getNumeroMesa().toString() : "", style);
                createStyledCell(row, 4, t.getTipoTestigo() != null ? t.getTipoTestigo().name() : "", style);
                createStyledCell(row, 5, safe(t.getDocumento()), style);
                createStyledCell(row, 6, safe(t.getNombreCompleto()), style);
                createStyledCell(row, 7, safe(t.getCelular()), style);
                createStyledCell(row, 8, safe(t.getCorreo()), style);
                createStyledCell(row, 9, safe(t.getNombreOrganizacion()), style);
            }

            int[] colWidths = {20, 34, 10, 8, 14, 16, 34, 15, 30, 24};
            for (int i = 0; i < colWidths.length; i++) sheet.setColumnWidth(i, colWidths[i] * 256);

            try (FileOutputStream fos = new FileOutputStream(outputFile)) { workbook.write(fos); }
        }

        try {
            auditService.log(AccionAuditoria.EXPORTACION_EXCEL, "Exportación testigos municipio " + municipio.getNombre(), "Excel", null);
        } catch (Exception e) { logger.warn("No se pudo registrar auditoría: {}", e.getMessage()); }

        return outputFile;
    }

    // ─── Column layout for coordinadores export ───────────────────────────────
    // Col 0 : MUNICIPIO
    // Col 1 : ZONA
    // Col 2 : COD_PUESTO
    // Col 3 : NOMBRE PUESTO
    // Col 4 : TIPO FILA  ("★ COORDINADOR" / "  Testigo")
    // Col 5 : DOCUMENTO
    // Col 6 : NOMBRE COMPLETO
    // Col 7 : CELULAR
    // Col 8 : CORREO
    // Col 9 : MESA         (sólo testigos)
    // Col 10: ORGANIZACIÓN (sólo testigos)
    // Col 11: TIPO TESTIGO (sólo testigos)

    private static final String[] HEADERS_COORDINADORES = {
        "MUNICIPIO", "ZONA", "COD_PUESTO", "NOMBRE PUESTO",
        "ROL", "DOCUMENTO", "NOMBRE COMPLETO", "CELULAR", "CORREO",
        "MESA", "ORGANIZACIÓN", "TIPO TESTIGO"
    };

    @Transactional
    public File exportarCoordinadores(Long municipioId) throws IOException {
        logger.info("Iniciando exportación de Excel de coordinadores para municipio ID: {}...", municipioId);

        Municipio municipio = municipioRepository.findById(municipioId)
                .orElseThrow(() -> new IllegalArgumentException("Municipio no encontrado con ID: " + municipioId));

        File outputFile = File.createTempFile("Coordinadores_" + municipio.getNombre().replace(" ", "_") + "_", ".xlsx");

        List<Puesto> puestos = puestoRepository.findByMunicipioId(municipioId);

        try (org.apache.poi.xssf.usermodel.XSSFWorkbook workbook = new org.apache.poi.xssf.usermodel.XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Coordinadores y Testigos");

            // ── Configuración de página para impresión ──────────────────────
            sheet.getPrintSetup().setLandscape(false);
            sheet.getPrintSetup().setPaperSize(PrintSetup.LETTER_PAPERSIZE);
            sheet.setFitToPage(true);
            sheet.getPrintSetup().setFitWidth((short) 1);
            sheet.getPrintSetup().setFitHeight((short) 0);
            sheet.setMargin(Sheet.LeftMargin,   0.5);
            sheet.setMargin(Sheet.RightMargin,  0.5);
            sheet.setMargin(Sheet.TopMargin,    0.75);
            sheet.setMargin(Sheet.BottomMargin, 0.75);
            sheet.setRepeatingRows(new org.apache.poi.ss.util.CellRangeAddress(0, 0, -1, -1));

            // ── Estilos de celda ────────────────────────────────────────────
            // Helper: borde fino en todos los lados
            final short THIN = BorderStyle.THIN.getCode();

            // Encabezado
            org.apache.poi.xssf.usermodel.XSSFCellStyle headerStyle = workbook.createCellStyle();
            org.apache.poi.xssf.usermodel.XSSFFont headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerFont.setFontHeightInPoints((short) 11);
            headerFont.setColor(IndexedColors.WHITE.getIndex());
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(new org.apache.poi.xssf.usermodel.XSSFColor(new byte[]{(byte)0x1F,(byte)0x3D,(byte)0x7A}, null));
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            headerStyle.setAlignment(HorizontalAlignment.CENTER);
            headerStyle.setVerticalAlignment(VerticalAlignment.CENTER);
            setBorderThin(headerStyle, THIN);
            headerStyle.setWrapText(false);

            // Coordinador – fondo amarillo oscuro
            org.apache.poi.xssf.usermodel.XSSFCellStyle coordStyle = workbook.createCellStyle();
            org.apache.poi.xssf.usermodel.XSSFFont coordFont = workbook.createFont();
            coordFont.setBold(true);
            coordFont.setFontHeightInPoints((short) 10);
            coordFont.setColor(new org.apache.poi.xssf.usermodel.XSSFColor(new byte[]{(byte)0x5C,(byte)0x3A,(byte)0x00}, null));
            coordStyle.setFont(coordFont);
            coordStyle.setFillForegroundColor(new org.apache.poi.xssf.usermodel.XSSFColor(new byte[]{(byte)0xFF,(byte)0xE0,(byte)0x82}, null));
            coordStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            coordStyle.setVerticalAlignment(VerticalAlignment.CENTER);
            setBorderThin(coordStyle, THIN);

            // Coordinador sin asignar
            org.apache.poi.xssf.usermodel.XSSFCellStyle noCoordStyle = workbook.createCellStyle();
            org.apache.poi.xssf.usermodel.XSSFFont noCoordFont = workbook.createFont();
            noCoordFont.setItalic(true);
            noCoordFont.setFontHeightInPoints((short) 10);
            noCoordFont.setColor(new org.apache.poi.xssf.usermodel.XSSFColor(new byte[]{(byte)0x99,(byte)0x00,(byte)0x00}, null));
            noCoordStyle.setFont(noCoordFont);
            noCoordStyle.setFillForegroundColor(new org.apache.poi.xssf.usermodel.XSSFColor(new byte[]{(byte)0xFF,(byte)0xE4,(byte)0xE4}, null));
            noCoordStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            noCoordStyle.setVerticalAlignment(VerticalAlignment.CENTER);
            setBorderThin(noCoordStyle, THIN);

            // Testigo – filas alternas blanco / gris muy claro
            org.apache.poi.xssf.usermodel.XSSFCellStyle testigoStyle = workbook.createCellStyle();
            org.apache.poi.xssf.usermodel.XSSFFont testigoFont = workbook.createFont();
            testigoFont.setFontHeightInPoints((short) 10);
            testigoStyle.setFont(testigoFont);
            testigoStyle.setFillForegroundColor(new org.apache.poi.xssf.usermodel.XSSFColor(new byte[]{(byte)0xFF,(byte)0xFF,(byte)0xFF}, null));
            testigoStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            testigoStyle.setVerticalAlignment(VerticalAlignment.CENTER);
            setBorderThin(testigoStyle, THIN);

            org.apache.poi.xssf.usermodel.XSSFCellStyle testigoAltStyle = workbook.createCellStyle();
            testigoAltStyle.cloneStyleFrom(testigoStyle);
            testigoAltStyle.setFillForegroundColor(new org.apache.poi.xssf.usermodel.XSSFColor(new byte[]{(byte)0xF2,(byte)0xF5,(byte)0xFA}, null));
            testigoAltStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            // ── Encabezado ──────────────────────────────────────────────────
            Row headerRow = sheet.createRow(0);
            headerRow.setHeightInPoints(22);
            for (int i = 0; i < HEADERS_COORDINADORES.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(HEADERS_COORDINADORES[i]);
                cell.setCellStyle(headerStyle);
            }

            // ── Datos agrupados por puesto ──────────────────────────────────
            int rowIdx = 1;
            for (Puesto puesto : puestos) {
                Testigo coord  = puesto.getCoordinador();
                List<Testigo> testigos = testigoRepository.findByPuestoId(puesto.getId());

                // — Fila del coordinador ——————————————————————————————————
                Row coordRow = sheet.createRow(rowIdx++);
                coordRow.setHeightInPoints(18);
                org.apache.poi.xssf.usermodel.XSSFCellStyle usedCoordStyle = (coord != null) ? coordStyle : noCoordStyle;

                String munNombre = municipio.getNombre();
                String zona      = puesto != null ? safe(puesto.getZona())        : "";
                String codPuesto = puesto != null ? safe(puesto.getCodigoPuesto()): "";
                String nomPuesto = puesto != null ? safe(puesto.getNombrePuesto()): "";

                createStyledCell(coordRow, 0, munNombre,  usedCoordStyle);
                createStyledCell(coordRow, 1, zona,       usedCoordStyle);
                createStyledCell(coordRow, 2, codPuesto,  usedCoordStyle);
                createStyledCell(coordRow, 3, nomPuesto,  usedCoordStyle);
                createStyledCell(coordRow, 4, "★ COORDINADOR", usedCoordStyle);

                if (coord != null) {
                    createStyledCell(coordRow, 5, safe(coord.getDocumento()),     usedCoordStyle);
                    createStyledCell(coordRow, 6, safe(coord.getNombreCompleto()),usedCoordStyle);
                    createStyledCell(coordRow, 7, safe(coord.getCelular()),       usedCoordStyle);
                    createStyledCell(coordRow, 8, safe(coord.getCorreo()),        usedCoordStyle);
                } else {
                    createStyledCell(coordRow, 5, "",                             usedCoordStyle);
                    createStyledCell(coordRow, 6, "SIN COORDINADOR ASIGNADO",    usedCoordStyle);
                    createStyledCell(coordRow, 7, "",                             usedCoordStyle);
                    createStyledCell(coordRow, 8, "",                             usedCoordStyle);
                }
                // Celdas vacías para columnas de testigo
                for (int c = 9; c <= 11; c++) createStyledCell(coordRow, c, "", usedCoordStyle);

                // — Filas de testigos ——————————————————————————————————————
                if (testigos != null) {
                    int testigoNum = 0;
                    for (Testigo t : testigos) {
                        // excluir al propio coordinador si está en la lista
                        if (coord != null && coord.getId() != null && coord.getId().equals(t.getId())) continue;

                        org.apache.poi.xssf.usermodel.XSSFCellStyle ts = (testigoNum % 2 == 0) ? testigoStyle : testigoAltStyle;
                        Row tRow = sheet.createRow(rowIdx++);
                        tRow.setHeightInPoints(16);

                        createStyledCell(tRow, 0, munNombre,  ts);
                        createStyledCell(tRow, 1, zona,       ts);
                        createStyledCell(tRow, 2, codPuesto,  ts);
                        createStyledCell(tRow, 3, nomPuesto,  ts);
                        createStyledCell(tRow, 4, "  Testigo",ts);
                        createStyledCell(tRow, 5, safe(t.getDocumento()),      ts);
                        createStyledCell(tRow, 6, safe(t.getNombreCompleto()), ts);
                        createStyledCell(tRow, 7, safe(t.getCelular()),        ts);
                        createStyledCell(tRow, 8, safe(t.getCorreo()),         ts);
                        createStyledCell(tRow, 9,
                            t.getMesa() != null && t.getMesa().getNumeroMesa() != null
                                ? t.getMesa().getNumeroMesa().toString() : "", ts);
                        createStyledCell(tRow, 10, safe(t.getNombreOrganizacion()), ts);
                        createStyledCell(tRow, 11,
                            t.getTipoTestigo() != null ? t.getTipoTestigo().name() : "", ts);
                        testigoNum++;
                    }
                }

                // Fila separadora vacía entre puestos (visual)
                Row sep = sheet.createRow(rowIdx++);
                sep.setHeightInPoints(6);
            }

            // ── Anchos de columna ───────────────────────────────────────────
            int[] colWidths = {18, 8, 12, 34, 16, 16, 32, 15, 30, 7, 24, 14};
            for (int i = 0; i < colWidths.length; i++) {
                sheet.setColumnWidth(i, colWidths[i] * 256);
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

    /** Crea una celda con valor y estilo en una fila dada. */
    private void createStyledCell(Row row, int col, String value,
                                  org.apache.poi.xssf.usermodel.XSSFCellStyle style) {
        Cell cell = row.createCell(col);
        cell.setCellValue(value != null ? value : "");
        cell.setCellStyle(style);
    }

    /** Aplica borde fino a los 4 lados de un XSSFCellStyle. */
    private void setBorderThin(org.apache.poi.xssf.usermodel.XSSFCellStyle style, short thin) {
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
    }
}
