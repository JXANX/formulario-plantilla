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

    // Headers que replican exactamente la PLANTILLA_DEFINITIVA (columnas A-Q)
    private static final String[] HEADERS = {
        "COD DEPARTAMENTO",       // A
        "COD MUNICIPIO",          // B
        "ZONA",                   // C
        "COD PUESTO",             // D
        "NOM DEPARTAMENTO (Opcional)",  // E
        "NOM MUNICIPIO (Opcional)",     // F
        "NOM PUESTO (Opcional)",        // G
        "MESA (Opcional)",              // H
        "NOMBRE ORGANIZACIÓN",          // I
        "TIPO TESTIGO",                 // J
        "Nº DOCUMENTO",                 // K
        "NOMBRE",                       // L
        "SEGUNDO NOMBRE",               // M
        "APELLIDO",                     // N
        "SEGUNDO APELLIDO",             // O
        "CELULAR (Opcional) / De ser diligenciado se somete a tratamiento de datos personales",       // P
        "CORREO ELECTRÓNICO (Opcional) / De ser diligenciado se somete a tratamiento de datos personales" // Q
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

        try (org.apache.poi.xssf.usermodel.XSSFWorkbook workbook = new org.apache.poi.xssf.usermodel.XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Plantilla");

            // ── Colores exactos de la plantilla original ─────────────────────
            byte[] colorHeader  = {(byte)0x1F,(byte)0x4E,(byte)0x79}; // #1F4E79
            byte[] colorBlueRow = {(byte)0xD9,(byte)0xE1,(byte)0xF2}; // #D9E1F2
            byte[] colorWhite   = {(byte)0xFF,(byte)0xFF,(byte)0xFF}; // #FFFFFF
            byte[] colorFontBlue= {(byte)0x1F,(byte)0x4E,(byte)0x79}; // #1F4E79
            byte[] colorBorder  = {(byte)0xBD,(byte)0xD7,(byte)0xEE}; // #BDD7EE

            // ── Fuentes ──────────────────────────────────────────────────────
            org.apache.poi.xssf.usermodel.XSSFFont fontHeader = workbook.createFont();
            fontHeader.setFontName("Arial");
            fontHeader.setBold(true);
            fontHeader.setFontHeightInPoints((short) 10);
            fontHeader.setColor(new org.apache.poi.xssf.usermodel.XSSFColor(new byte[]{(byte)0xFF,(byte)0xFF,(byte)0xFF}, null));

            org.apache.poi.xssf.usermodel.XSSFFont fontBlue = workbook.createFont();
            fontBlue.setFontName("Arial");
            fontBlue.setFontHeightInPoints((short) 9);
            fontBlue.setColor(new org.apache.poi.xssf.usermodel.XSSFColor(colorFontBlue, null));

            org.apache.poi.xssf.usermodel.XSSFFont fontNormal = workbook.createFont();
            fontNormal.setFontName("Arial");
            fontNormal.setFontHeightInPoints((short) 9);

            // ── Estilo ENCABEZADO ─────────────────────────────────────────────
            org.apache.poi.xssf.usermodel.XSSFCellStyle sHeader = workbook.createCellStyle();
            sHeader.setFont(fontHeader);
            sHeader.setFillForegroundColor(new org.apache.poi.xssf.usermodel.XSSFColor(colorHeader, null));
            sHeader.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            sHeader.setAlignment(HorizontalAlignment.CENTER);
            sHeader.setVerticalAlignment(VerticalAlignment.CENTER);
            sHeader.setWrapText(true);
            applyBlueBorder(sHeader, colorBorder);

            // ── Estilo DATO AZUL (cols A-D, I-J) ─────────────────────────────
            org.apache.poi.xssf.usermodel.XSSFCellStyle sBlue = workbook.createCellStyle();
            sBlue.setFont(fontBlue);
            sBlue.setFillForegroundColor(new org.apache.poi.xssf.usermodel.XSSFColor(colorBlueRow, null));
            sBlue.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            sBlue.setAlignment(HorizontalAlignment.CENTER);
            sBlue.setVerticalAlignment(VerticalAlignment.CENTER);
            sBlue.setWrapText(true);
            applyBlueBorder(sBlue, colorBorder);

            // ── Estilo DATO BLANCO (cols E-H, K-Q) ───────────────────────────
            org.apache.poi.xssf.usermodel.XSSFCellStyle sWhite = workbook.createCellStyle();
            sWhite.setFont(fontNormal);
            sWhite.setFillForegroundColor(new org.apache.poi.xssf.usermodel.XSSFColor(colorWhite, null));
            sWhite.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            sWhite.setAlignment(HorizontalAlignment.LEFT);
            sWhite.setVerticalAlignment(VerticalAlignment.CENTER);
            applyBlueBorder(sWhite, colorBorder);

            // ── Fila encabezado ───────────────────────────────────────────────
            Row headerRow = sheet.createRow(0);
            headerRow.setHeightInPoints(30);
            for (int i = 0; i < HEADERS.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(HEADERS[i]);
                cell.setCellStyle(sHeader);
            }

            // ── Datos (altura 24pt como plantilla) ───────────────────────────
            int rowIdx = 1;
            for (Mesa mesa : mesas) {
                Puesto puesto = mesa.getPuesto();
                Municipio municipio = puesto != null ? puesto.getMunicipio() : null;
                Departamento departamento = municipio != null ? municipio.getDepartamento() : null;

                java.util.List<Testigo> testigos = mesa.getId() != null ? testigosByMesa.get(mesa.getId()) : null;
                if (testigos == null) {
                    testigos = new java.util.ArrayList<>();
                }

                // La plantilla original siempre tiene EXACTAMENTE 2 filas por mesa (los "huecos")
                int rowCountForMesa = Math.max(2, testigos.size());

                for (int i = 0; i < rowCountForMesa; i++) {
                    Testigo testigo = (i < testigos.size()) ? testigos.get(i) : null;

                    Row row = sheet.createRow(rowIdx++);
                    row.setHeightInPoints(24);
                    writeBaseColumns(row, departamento, municipio, puesto, mesa, sBlue, sWhite);

                    if (testigo != null) {
                        // Fila con testigo
                        createStyledCell(row, 8,  safe(testigo.getNombreOrganizacion()), sBlue);
                        createStyledCell(row, 9,  testigo.getTipoTestigo() != null ? testigo.getTipoTestigo().name() : "", sBlue);
                        createStyledCell(row, 10, safe(testigo.getDocumento()), sWhite);
                        createStyledCell(row, 11, safe(testigo.getNombre()), sWhite);
                        createStyledCell(row, 12, safe(testigo.getSegundoNombre()), sWhite);
                        createStyledCell(row, 13, safe(testigo.getPrimerApellido()), sWhite);
                        createStyledCell(row, 14, safe(testigo.getSegundoApellido()), sWhite);
                        createStyledCell(row, 15, safe(testigo.getCelular()), sWhite);
                        createStyledCell(row, 16, safe(testigo.getCorreo()), sWhite);
                    } else {
                        // Hueco vacío, preservando la organización y TIPO_TESTIGO de la plantilla por defecto
                        createStyledCell(row, 8,  "Grupo Significativo de Ciudadanos Defensores de la Patria", sBlue);
                        createStyledCell(row, 9,  "PRINCIPAL", sBlue);
                        for (int c = 10; c <= 16; c++) createStyledCell(row, c, "", sWhite);
                    }
                }
            }

            // ── Anchos exactos de la plantilla: A=20,B=17,C=12,D=14,E=31,F=28,G=40,H=19,I=40,J=16,K=16,L=12,M=18,N=12,O=20,P=40,Q=40
            int[] colWidths = {20, 17, 12, 14, 31, 28, 40, 19, 40, 16, 16, 12, 18, 12, 20, 40, 40};
            for (int i = 0; i < colWidths.length; i++) {
                sheet.setColumnWidth(i, colWidths[i] * 256);
            }

            sheet.createFreezePane(0, 1);

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

    /** Aplica bordes azul claro #BDD7EE a todos los lados del estilo. */
    private void applyBlueBorder(org.apache.poi.xssf.usermodel.XSSFCellStyle style, byte[] colorBorder) {
        org.apache.poi.xssf.usermodel.XSSFColor bc = new org.apache.poi.xssf.usermodel.XSSFColor(colorBorder, null);
        style.setBorderTop(BorderStyle.THIN);    style.setTopBorderColor(bc);
        style.setBorderBottom(BorderStyle.THIN); style.setBottomBorderColor(bc);
        style.setBorderLeft(BorderStyle.THIN);   style.setLeftBorderColor(bc);
        style.setBorderRight(BorderStyle.THIN);  style.setRightBorderColor(bc);
    }

    private void writeBaseColumns(Row row, Departamento depto, Municipio mpio, Puesto puesto, Mesa mesa,
                                   org.apache.poi.xssf.usermodel.XSSFCellStyle sBlue,
                                   org.apache.poi.xssf.usermodel.XSSFCellStyle sWhite) {
        // A-D: códigos → azul centrado
        createStyledCell(row, 0, depto  != null ? safe(depto.getCodigoDepartamento()) : "", sBlue);
        createStyledCell(row, 1, mpio   != null ? safe(mpio.getCodigoMunicipio())     : "", sBlue);
        createStyledCell(row, 2, puesto != null ? safe(puesto.getZona())              : "", sBlue);
        createStyledCell(row, 3, puesto != null ? safe(puesto.getCodigoPuesto())      : "", sBlue);
        // E-H: nombres → blanco izquierda
        createStyledCell(row, 4, depto  != null ? safe(depto.getNombre())             : "", sWhite);
        createStyledCell(row, 5, mpio   != null ? safe(mpio.getNombre())              : "", sWhite);
        createStyledCell(row, 6, puesto != null ? safe(puesto.getNombrePuesto())      : "", sWhite);
        createStyledCell(row, 7, mesa   != null && mesa.getNumeroMesa() != null ? mesa.getNumeroMesa().toString() : "", sWhite);
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

    private static final String[] HEADERS_COORDINADORES = {
        "Puesto", "Documento", "Coordinador/a", "Celular", "Correo Electrónico", "Total Mesas", "Mesas Cubiertas", "Mesas Faltantes"
    };

    @Transactional
    public File exportarCoordinadores(Long municipioId) throws IOException {
        logger.info("Iniciando exportación de Excel de coordinadores para municipio ID: {}...", municipioId);

        Municipio municipio = municipioRepository.findById(municipioId)
                .orElseThrow(() -> new IllegalArgumentException("Municipio no encontrado con ID: " + municipioId));

        File outputFile = File.createTempFile("Coordinadores_" + municipio.getNombre().replace(" ", "_") + "_", ".xlsx");

        List<Puesto> puestos = puestoRepository.findByMunicipioId(municipioId);

        try (org.apache.poi.xssf.usermodel.XSSFWorkbook workbook = new org.apache.poi.xssf.usermodel.XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Coordinadores");

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

            // Filas
            org.apache.poi.xssf.usermodel.XSSFCellStyle rowStyle = workbook.createCellStyle();
            org.apache.poi.xssf.usermodel.XSSFFont rowFont = workbook.createFont();
            rowFont.setFontHeightInPoints((short) 10);
            rowStyle.setFont(rowFont);
            rowStyle.setVerticalAlignment(VerticalAlignment.CENTER);
            setBorderThin(rowStyle, THIN);

            org.apache.poi.xssf.usermodel.XSSFCellStyle rowAltStyle = workbook.createCellStyle();
            rowAltStyle.cloneStyleFrom(rowStyle);
            rowAltStyle.setFillForegroundColor(new org.apache.poi.xssf.usermodel.XSSFColor(new byte[]{(byte)0xF2,(byte)0xF5,(byte)0xFA}, null));
            rowAltStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

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
            for (int i = 0; i < puestos.size(); i++) {
                Puesto puesto = puestos.get(i);
                Testigo coord = puesto.getCoordinador();
                
                int totalMesas = 0;
                int mesasCubiertas = 0;
                int mesasFaltantes = 0;

                if (puesto.getMesas() != null) {
                    totalMesas = puesto.getMesas().size();
                    for (Mesa m : puesto.getMesas()) {
                        if (m.getOcupados() != null && m.getOcupados() > 0) {
                            mesasCubiertas++;
                        } else {
                            mesasFaltantes++;
                        }
                    }
                }

                org.apache.poi.xssf.usermodel.XSSFCellStyle currentStyle = (i % 2 == 0) ? rowStyle : rowAltStyle;
                Row row = sheet.createRow(rowIdx++);
                row.setHeightInPoints(18);

                createStyledCell(row, 0, safe(puesto.getNombrePuesto()), currentStyle);
                createStyledCell(row, 1, coord != null ? safe(coord.getDocumento()) : "", currentStyle);
                createStyledCell(row, 2, coord != null ? safe(coord.getNombreCompleto()) : "", currentStyle);
                createStyledCell(row, 3, coord != null ? safe(coord.getCelular()) : "", currentStyle);
                createStyledCell(row, 4, coord != null ? safe(coord.getCorreo()) : "", currentStyle);
                createStyledCell(row, 5, String.valueOf(totalMesas), currentStyle);
                createStyledCell(row, 6, String.valueOf(mesasCubiertas), currentStyle);
                createStyledCell(row, 7, String.valueOf(mesasFaltantes), currentStyle);
            }

            // ── Anchos de columna ───────────────────────────────────────────
            int[] colWidths = {35, 15, 40, 15, 30, 12, 16, 16};
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
